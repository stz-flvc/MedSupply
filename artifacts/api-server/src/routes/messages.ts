import { Router, type IRouter } from "express";
import { eq, and, or, desc, inArray } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function messageToResponse(msg: typeof messagesTable.$inferSelect) {
  return {
    id: msg.id,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    content: msg.content,
    read: msg.read,
    createdAt: msg.createdAt.toISOString(),
  };
}

// GET /messages - Get chat history with another user
router.get("/messages", requireAuth, async (req, res): Promise<void> => {
  const me = req.session.userId!;
  const myRole = req.session.userRole!;
  const rawOtherId = req.query.otherUserId;

  let otherId: number;
  if (!rawOtherId) {
    if (myRole === "admin") {
      res.status(400).json({ error: "otherUserId is required for administrators" });
      return;
    }
    const [adminUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
    if (!adminUser) {
      res.status(404).json({ error: "Administrator account not found" });
      return;
    }
    otherId = adminUser.id;
  } else {
    otherId = parseInt(rawOtherId as string, 10);
    if (isNaN(otherId)) {
      res.status(400).json({ error: "Invalid otherUserId" });
      return;
    }
  }

  // Fetch other user to verify role
  const [otherUser] = await db.select().from(usersTable).where(eq(usersTable.id, otherId));
  if (!otherUser) {
    res.status(404).json({ error: "Other user not found" });
    return;
  }

  // Check roles: Vendor and Buyer cannot message each other
  // One of the participants MUST be an admin
  if (myRole !== "admin" && otherUser.role !== "admin") {
    res.status(403).json({ error: "Direct communication between buyers and vendors is not permitted." });
    return;
  }

  const messages = await db.select().from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.senderId, me), eq(messagesTable.receiverId, otherId)),
        and(eq(messagesTable.senderId, otherId), eq(messagesTable.receiverId, me))
      )
    )
    .orderBy(messagesTable.createdAt);

  res.json(messages.map(messageToResponse));
});

// POST /messages - Send a message
router.post("/messages", requireAuth, async (req, res): Promise<void> => {
  const me = req.session.userId!;
  const myRole = req.session.userRole!;
  const { receiverId, content } = req.body;

  if (!content?.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  let rxId: number;
  if (!receiverId) {
    if (myRole === "admin") {
      res.status(400).json({ error: "receiverId is required for administrators" });
      return;
    }
    const [adminUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
    if (!adminUser) {
      res.status(404).json({ error: "Administrator account not found" });
      return;
    }
    rxId = adminUser.id;
  } else {
    rxId = parseInt(receiverId, 10);
    if (isNaN(rxId)) {
      res.status(400).json({ error: "Invalid receiverId" });
      return;
    }
  }

  // Fetch receiver user to verify role
  const [receiver] = await db.select().from(usersTable).where(eq(usersTable.id, rxId));
  if (!receiver) {
    res.status(404).json({ error: "Receiver not found" });
    return;
  }

  // Vendor and Buyer cannot message each other
  if (myRole !== "admin" && receiver.role !== "admin") {
    res.status(403).json({ error: "Direct communication between buyers and vendors is not permitted." });
    return;
  }

  const [newMsg] = await db.insert(messagesTable).values({
    senderId: me,
    receiverId: rxId,
    content: content.trim(),
    read: false,
  }).returning();

  res.status(201).json(messageToResponse(newMsg));
});

// GET /messages/threads - (Admin only) List active chat threads
router.get("/messages/threads", requireAuth, async (req, res): Promise<void> => {
  const me = req.session.userId!;
  const myRole = req.session.userRole!;

  if (myRole !== "admin") {
    res.status(403).json({ error: "Only administrators can view message threads." });
    return;
  }

  // Retrieve all messages involving the admin
  const allMessages = await db.select().from(messagesTable)
    .where(or(eq(messagesTable.senderId, me), eq(messagesTable.receiverId, me)))
    .orderBy(desc(messagesTable.createdAt));

  // Extract unique other users and details
  const threadMap = new Map<number, typeof messagesTable.$inferSelect>();
  const unreadCounts = new Map<number, number>();

  for (const msg of allMessages) {
    const otherId = msg.senderId === me ? msg.receiverId : msg.senderId;
    if (!threadMap.has(otherId)) {
      threadMap.set(otherId, msg);
    }
    if (msg.receiverId === me && !msg.read) {
      unreadCounts.set(otherId, (unreadCounts.get(otherId) || 0) + 1);
    }
  }

  const otherUserIds = Array.from(threadMap.keys());
  if (otherUserIds.length === 0) {
    res.json([]);
    return;
  }

  const users = await db.select().from(usersTable).where(inArray(usersTable.id, otherUserIds));

  const threads = users.map((user) => {
    const lastMessage = threadMap.get(user.id)!;
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        fullName: user.fullName,
        companyName: user.companyName,
        phone: user.phone,
        createdAt: user.createdAt.toISOString(),
      },
      lastMessage: messageToResponse(lastMessage),
      unreadCount: unreadCounts.get(user.id) || 0,
    };
  });

  // Sort by last message time descending
  threads.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

  res.json(threads);
});

// POST /messages/read - Mark messages as read
router.post("/messages/read", requireAuth, async (req, res): Promise<void> => {
  const me = req.session.userId!;
  const { senderId } = req.body;

  let sndId: number;
  if (!senderId) {
    const [adminUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
    if (!adminUser) {
      res.status(404).json({ error: "Administrator account not found" });
      return;
    }
    sndId = adminUser.id;
  } else {
    sndId = parseInt(senderId, 10);
    if (isNaN(sndId)) {
      res.status(400).json({ error: "Invalid senderId" });
      return;
    }
  }

  await db.update(messagesTable)
    .set({ read: true })
    .where(and(eq(messagesTable.senderId, sndId), eq(messagesTable.receiverId, me)));

  res.json({ message: "Messages marked as read" });
});

export default router;
