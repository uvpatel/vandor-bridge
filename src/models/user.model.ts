import { Schema, model, Document } from "mongoose";

export interface User extends Document {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user" | "vendor";
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<User>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["admin", "user", "vendor"], default: "user" },
}, { timestamps: true });

const User = model<User>("User", userSchema);
export default User;

