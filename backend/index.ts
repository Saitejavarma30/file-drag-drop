const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
import Item from "./models/Item";
import Folder from "./models/Folder";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect("")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err: any) => console.error("MongoDB connection error:", err));

// API Routes
app.get(
  "/api/items",
  async (
    req: any,
    res: {
      json: (arg0: any) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { message: string }): void; new (): any };
      };
    }
  ) => {
    try {
      const items = await Item.find().sort({ order: 1 });
      res.json(items);
    } catch (err) {
      res.status(500).json({
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  }
);

app.get(
  "/api/folders",
  async (
    req: any,
    res: {
      json: (arg0: any) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { message: string }): void; new (): any };
      };
    }
  ) => {
    try {
      const folders = await Folder.find().sort({ order: 1 });
      res.json(folders);
    } catch (err) {
      res.status(500).json({
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  }
);

app.post(
  "/api/items",
  async (
    req: { body: { title: any; icon: any; folderId: any; order: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { message: string }): void; new (): any };
      };
    }
  ) => {
    const item = new Item({
      title: req.body.title,
      icon: req.body.icon,
      folderId: req.body.folderId || null,
      order: req.body.order,
    });

    try {
      const newItem = await item.save();
      io.emit("itemAdded", newItem.toObject ? newItem.toObject() : newItem);
      // @ts-ignore
      res.status(201).json(newItem);
    } catch (err) {
      res.status(400).json({
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  }
);

app.post(
  "/api/folders",
  async (
    req: { body: { name: any; isOpen: any; order: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { message: string }): void; new (): any };
      };
    }
  ) => {
    console.log(req.body);
    console.log(Folder);
    const folder = new Folder({
      name: req.body.name,
      isOpen: req.body.isOpen || true,
      order: req.body.order,
    });
    console.log(JSON.stringify(folder));
    try {
      const newFolder = await folder.save();
      io.emit("folderAdded", newFolder);
      // @ts-ignore
      res.status(201).json(newFolder);
    } catch (err) {
      res.status(400).json({
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  }
);

app.put(
  "/api/items/:id",
  async (
    req: { params: { id: any }; body: any },
    res: {
      json: (arg0: any) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { message: string }): void; new (): any };
      };
    }
  ) => {
    try {
      const updatedItem = await Item.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );
      io.emit("itemUpdated", updatedItem);
      res.json(updatedItem);
    } catch (err) {
      res.status(400).json({
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  }
);

app.put(
  "/api/folders/:id",
  async (
    req: { params: { id: any }; body: any },
    res: {
      json: (arg0: any) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { message: string }): void; new (): any };
      };
    }
  ) => {
    try {
      const updatedFolder = await Folder.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      io.emit("folderUpdated", updatedFolder);
      res.json(updatedFolder);
    } catch (err) {
      res.status(400).json({
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  }
);

app.put(
  "/api/reorder",
  async (
    req: { body: { items: any; folders: any } },
    res: {
      json: (arg0: { success: boolean }) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { message: string }): void; new (): any };
      };
    }
  ) => {
    const { items, folders } = req.body;

    try {
      // Update items
      if (items && items.length > 0) {
        for (const item of items) {
          await Item.findByIdAndUpdate(item._id, {
            order: item.order,
            folderId: item.folderId,
          });
        }
      }

      // Update folders
      if (folders && folders.length > 0) {
        for (const folder of folders) {
          await Folder.findByIdAndUpdate(folder._id, {
            order: folder.order,
          });
        }
      }

      io.emit("reordered", { items, folders });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  }
);

// Socket.IO
io.on(
  "connection",
  (socket: { on: (arg0: string, arg1: () => void) => void }) => {
    console.log("User connected");

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  }
);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
