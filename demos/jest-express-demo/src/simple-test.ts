import {MongoMemoryReplSet} from "mongodb-memory-server";
import {MongoClient} from "mongodb";

const start = async () => {
    console.log("⏳ Starting MongoMemoryReplSet...");
    const replSet = await MongoMemoryReplSet.create({
        replSet: {count: 1},
        binary: {version: "6.0.9"}, // works on ARM64
    });

    const uri = replSet.getUri();
    console.log("✅ Mongo started:", uri);

    console.log("⏳ Connecting with MongoClient...");
    const client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected to Mongo");

    const db = client.db("testdb");
    const users = db.collection("users");

    await users.insertOne({name: "Alice"});
    const all = await users.find().toArray();
    console.log("🎉 Query result:", all);

    await client.close();
    await replSet.stop();
};

start().catch(err => {
    console.error("❌ Failed:", err);
    process.exit(1);
});
