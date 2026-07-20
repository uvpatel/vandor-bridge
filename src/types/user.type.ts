export default interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user" | "vendor";
    createdAt: Date;
    updatedAt: Date;
}


type PurchaseOrder = {
  status: "draft" | "sent" | "paid" | "cancelled";
};