import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { asyncHandler, AppError } from "../utils/errors.js";
import { awardReputation, maybeAddDvsComment, moderateCommunityContent, notifyUser, sanitizeContent } from "../services/community-service.js";

const router = Router();
router.use(authenticate);

const postSchema = z.object({
  title: z.string().min(4).max(120),
  content: z.string().min(20).max(5000),
  category: z.enum(["CROPS", "LIVESTOCK", "SOIL", "WEATHER", "EQUIPMENT", "MARKET_PRICES", "SUCCESS_STORIES", "QUESTIONS", "GENERAL"]),
  photoUrls: z.array(z.string().url()).max(3).default([]),
  tags: z.array(z.string().min(1).max(24)).max(8).default([]),
  district: z.string().optional(),
  isAnonymous: z.boolean().default(false)
});

const commentSchema = z.object({
  content: z.string().min(2).max(2500),
  photoUrls: z.array(z.string().url()).max(3).default([]),
  isAnonymous: z.boolean().default(false),
  parentId: z.string().uuid().optional()
});

function authorSelect() {
  return {
    select: {
      id: true,
      name: true,
      locationName: true,
      reputation: true
    }
  } as const;
}

function isAdmin(req: AuthRequest) {
  return req.headers["x-admin-key"] && req.headers["x-admin-key"] === process.env.JWT_SECRET;
}

router.get(
  "/posts/trending",
  asyncHandler<AuthRequest>(async (_req, res) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await prisma.communityPost.findMany({
      where: { status: "ACTIVE", createdAt: { gte: since } },
      include: { author: authorSelect(), reactions: true, comments: true },
      orderBy: [{ isPinned: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
      take: 10
    });
    res.json({ posts: posts.sort((a, b) => b.viewCount + b.reactions.length * 3 - (a.viewCount + a.reactions.length * 3)) });
  })
);

router.get(
  "/posts/bookmarks",
  asyncHandler<AuthRequest>(async (req, res) => {
    const bookmarks = await prisma.communityBookmark.findMany({
      where: { userId: req.user.id },
      include: { post: { include: { author: authorSelect(), reactions: true, comments: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json({ posts: bookmarks.map((bookmark) => bookmark.post) });
  })
);

router.get(
  "/posts",
  asyncHandler<AuthRequest>(async (req, res) => {
    const query = z
      .object({
        category: z.string().optional(),
        district: z.string().optional(),
        search: z.string().optional()
      })
      .parse(req.query);
    const posts = await prisma.communityPost.findMany({
      where: {
        status: "ACTIVE",
        category: query.category && query.category !== "ALL" ? (query.category as any) : undefined,
        district: query.district || undefined,
        OR: query.search
          ? [
              { title: { contains: query.search, mode: "insensitive" } },
              { content: { contains: query.search, mode: "insensitive" } },
              { tags: { has: query.search } }
            ]
          : undefined
      },
      include: { author: authorSelect(), reactions: true, comments: true, bookmarks: { where: { userId: req.user.id } } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 50
    });
    res.json({ posts });
  })
);

router.post(
  "/posts",
  asyncHandler<AuthRequest>(async (req, res) => {
    const input = postSchema.parse(req.body);
    const title = sanitizeContent(input.title);
    const content = sanitizeContent(input.content);
    const moderation = await moderateCommunityContent(`${title}\n${content}`);
    const post = await prisma.communityPost.create({
      data: {
        authorId: req.user.id,
        title,
        content,
        category: input.category,
        photoUrls: input.photoUrls,
        tags: input.tags.map(sanitizeContent).filter(Boolean),
        district: input.district ? sanitizeContent(input.district) : null,
        isAnonymous: input.isAnonymous,
        status: moderation.flagged ? "HIDDEN" : "ACTIVE"
      },
      include: { author: authorSelect(), reactions: true, comments: true }
    });
    await awardReputation(req.user.id, 2, { postCount: 1 });
    if (moderation.notifiableDisease) await maybeAddDvsComment(post.id, req.user.id, content);
    res.status(201).json({ post, moderation });
  })
);

router.get(
  "/posts/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    await prisma.communityPost.update({ where: { id: req.params.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
    const post = await prisma.communityPost.findFirst({
      where: { id: req.params.id, status: { not: "REMOVED" } },
      include: {
        author: authorSelect(),
        reactions: true,
        bookmarks: { where: { userId: req.user.id } },
        comments: {
          where: { parentId: null },
          include: { author: authorSelect(), reactions: true, replies: { include: { author: authorSelect(), reactions: true } } },
          orderBy: [{ isBestAnswer: "desc" }, { createdAt: "asc" }]
        }
      }
    });
    if (!post) throw new AppError(404, "Post not found");
    res.json({ post });
  })
);

router.put(
  "/posts/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    const existing = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Post not found");
    if (existing.authorId !== req.user.id && !isAdmin(req)) throw new AppError(403, "You can edit only your own post");
    const input = postSchema.partial().parse(req.body);
    const post = await prisma.communityPost.update({
      where: { id: req.params.id },
      data: {
        title: input.title ? sanitizeContent(input.title) : undefined,
        content: input.content ? sanitizeContent(input.content) : undefined,
        category: input.category,
        photoUrls: input.photoUrls,
        tags: input.tags?.map(sanitizeContent).filter(Boolean),
        district: input.district ? sanitizeContent(input.district) : undefined,
        isAnonymous: input.isAnonymous
      }
    });
    res.json({ post });
  })
);

router.delete(
  "/posts/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.id } });
    if (!post) throw new AppError(404, "Post not found");
    if (post.authorId !== req.user.id && !isAdmin(req)) throw new AppError(403, "You can delete only your own post");
    await prisma.communityPost.update({ where: { id: post.id }, data: { status: "REMOVED" } });
    res.json({ ok: true });
  })
);

router.post(
  "/posts/:id/pin",
  asyncHandler<AuthRequest>(async (req, res) => {
    if (!isAdmin(req)) throw new AppError(403, "Admin required");
    const post = await prisma.communityPost.update({ where: { id: req.params.id }, data: { isPinned: true } });
    res.json({ post });
  })
);

router.post(
  "/posts/:id/verify",
  asyncHandler<AuthRequest>(async (req, res) => {
    if (!isAdmin(req)) throw new AppError(403, "Admin required");
    const post = await prisma.communityPost.update({ where: { id: req.params.id }, data: { isVerified: true } });
    await notifyUser(post.authorId, "Post expert verified", "Your community post was marked expert verified.", { postId: post.id });
    res.json({ post });
  })
);

router.post(
  "/posts/:postId/comments",
  asyncHandler<AuthRequest>(async (req, res) => {
    const input = commentSchema.parse(req.body);
    const post = await prisma.communityPost.findUnique({ where: { id: req.params.postId } });
    if (!post) throw new AppError(404, "Post not found");
    const content = sanitizeContent(input.content);
    const moderation = await moderateCommunityContent(content);
    const comment = await prisma.communityComment.create({
      data: {
        postId: post.id,
        authorId: req.user.id,
        content,
        photoUrls: input.photoUrls,
        isAnonymous: input.isAnonymous,
        parentId: input.parentId,
      },
      include: { author: authorSelect(), reactions: true }
    });
    if (moderation.notifiableDisease) await maybeAddDvsComment(post.id, req.user.id, content);
    if (post.authorId !== req.user.id) await notifyUser(post.authorId, "New comment", "Someone commented on your community post.", { postId: post.id, commentId: comment.id });
    if (input.parentId) {
      const parent = await prisma.communityComment.findUnique({ where: { id: input.parentId } });
      if (parent && parent.authorId !== req.user.id) await notifyUser(parent.authorId, "New reply", "Someone replied to your community comment.", { postId: post.id, commentId: comment.id });
    }
    res.status(201).json({ comment, moderation });
  })
);

router.put(
  "/comments/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z.object({ content: z.string().min(2).max(2500) }).parse(req.body);
    const comment = await prisma.communityComment.findUnique({ where: { id: req.params.id } });
    if (!comment) throw new AppError(404, "Comment not found");
    if (comment.authorId !== req.user.id && !isAdmin(req)) throw new AppError(403, "You can edit only your own comment");
    const updated = await prisma.communityComment.update({ where: { id: comment.id }, data: { content: sanitizeContent(body.content) } });
    res.json({ comment: updated });
  })
);

router.delete(
  "/comments/:id",
  asyncHandler<AuthRequest>(async (req, res) => {
    const comment = await prisma.communityComment.findUnique({ where: { id: req.params.id } });
    if (!comment) throw new AppError(404, "Comment not found");
    if (comment.authorId !== req.user.id && !isAdmin(req)) throw new AppError(403, "You can delete only your own comment");
    await prisma.communityComment.delete({ where: { id: comment.id } });
    res.json({ ok: true });
  })
);

router.post(
  "/comments/:id/best-answer",
  asyncHandler<AuthRequest>(async (req, res) => {
    const comment = await prisma.communityComment.findUnique({ where: { id: req.params.id }, include: { post: true } });
    if (!comment) throw new AppError(404, "Comment not found");
    if (comment.post.authorId !== req.user.id) throw new AppError(403, "Only the post author can choose the best answer");
    await prisma.communityComment.updateMany({ where: { postId: comment.postId }, data: { isBestAnswer: false } });
    const updated = await prisma.communityComment.update({ where: { id: comment.id }, data: { isBestAnswer: true } });
    await awardReputation(comment.authorId, 10, { bestAnswerCount: 1 });
    await notifyUser(comment.authorId, "Best answer", "Your answer was marked as the best answer.", { postId: comment.postId, commentId: comment.id });
    res.json({ comment: updated });
  })
);

router.post(
  "/react",
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z.object({ targetId: z.string().uuid(), targetType: z.enum(["post", "comment"]), type: z.enum(["HELPFUL", "LEARNED", "THANKS"]) }).parse(req.body);
    const data = body.targetType === "post" ? { postId: body.targetId, commentId: null } : { postId: null, commentId: body.targetId };
    const reaction = await prisma.communityReaction.upsert({
      where:
        body.targetType === "post"
          ? { userId_postId_type: { userId: req.user.id, postId: body.targetId, type: body.type } }
          : { userId_commentId_type: { userId: req.user.id, commentId: body.targetId, type: body.type } },
      update: {},
      create: { userId: req.user.id, type: body.type, ...data }
    });
    if (body.type === "HELPFUL") {
      const owner =
        body.targetType === "post"
          ? await prisma.communityPost.findUnique({ where: { id: body.targetId }, select: { authorId: true } })
          : await prisma.communityComment.findUnique({ where: { id: body.targetId }, select: { authorId: true } });
      if (owner?.authorId && owner.authorId !== req.user.id) await awardReputation(owner.authorId, 3, { helpfulCount: 1 });
    }
    res.json({ reaction });
  })
);

router.post(
  "/bookmarks/:postId",
  asyncHandler<AuthRequest>(async (req, res) => {
    const existing = await prisma.communityBookmark.findUnique({ where: { userId_postId: { userId: req.user.id, postId: req.params.postId } } });
    if (existing) {
      await prisma.communityBookmark.delete({ where: { id: existing.id } });
      return res.json({ bookmarked: false });
    }
    await prisma.communityBookmark.create({ data: { userId: req.user.id, postId: req.params.postId } });
    res.json({ bookmarked: true });
  })
);

router.get(
  "/market-prices",
  asyncHandler(async (req, res) => {
    const query = z.object({ crop: z.string().optional(), district: z.string().optional() }).parse(req.query);
    const prices = await prisma.marketPrice.findMany({
      where: { crop: query.crop, district: query.district },
      include: { reporter: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json({ prices });
  })
);

router.post(
  "/market-prices",
  asyncHandler<AuthRequest>(async (req, res) => {
    const body = z.object({ crop: z.string().min(2), pricePerKg: z.coerce.number().positive(), district: z.string().min(2), marketName: z.string().optional() }).parse(req.body);
    const price = await prisma.marketPrice.create({
      data: {
        crop: sanitizeContent(body.crop),
        pricePerKg: body.pricePerKg,
        district: sanitizeContent(body.district),
        marketName: body.marketName ? sanitizeContent(body.marketName) : null,
        reportedBy: req.user.id
      }
    });
    res.status(201).json({ price });
  })
);

router.get(
  "/market-prices/trends",
  asyncHandler(async (req, res) => {
    const query = z.object({ crop: z.string().optional(), district: z.string().optional() }).parse(req.query);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const prices = await prisma.marketPrice.findMany({
      where: { crop: query.crop, district: query.district, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" }
    });
    res.json({ trends: prices });
  })
);

router.get(
  "/reputation/:userId",
  asyncHandler(async (req, res) => {
    const reputation = await prisma.userReputation.findUnique({ where: { userId: req.params.userId }, include: { user: { select: { id: true, name: true, locationName: true, createdAt: true } } } });
    const posts = await prisma.communityPost.findMany({ where: { authorId: req.params.userId, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 10 });
    res.json({ reputation, posts });
  })
);

export default router;
