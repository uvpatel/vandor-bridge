import { Schema, model, models} from "mongoose";


interface Tweet {
    content: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}


const tweetSchema = new Schema<Tweet>({
    content: { type: String, required: true },
    image: { type: String },

})


export default models.Tweet || model<Tweet>("Tweet", tweetSchema);


