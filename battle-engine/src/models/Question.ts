import mongoose, { Document, ObjectId, Schema } from "mongoose";

interface IExample {
  input: string;
  output: string;
  explanation: string;
}

interface ITestCase {
  input: string;
  output: string[];
}

export interface IQuestion extends Document {
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  task: string;
  input_format: string;
  constraints: string;
  output_format: string; 
  time: number;
  examples: IExample[];
  test_cases: ITestCase[];
  template: Record<string, string>;
  approved: boolean;
  suggestedBy: ObjectId;
  pings: ObjectId[];
  submits: ObjectId[];
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const QuestionSchema: Schema = new Schema<IQuestion>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ["Easy", "Medium", "Hard"] },
    task: { type: String, required: true },
    input_format: { type: String, required: true },
    constraints: { type: String, required: true },
    output_format: { type: String, required: true },
    time: { type: Number, required: true },
    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String, required: true },
      },
    ],
    test_cases: [
      {
        input: { type: String, required: true },
        output: {
          type: [String],
          required: true,
          validate: {
            validator: (arr: string[]) => arr.length > 0,
            message: "At least one output is required for each test case",
          },
        },
      },
    ],
    template: {
      type: Object,
      required: true,
      default: {},
    },
    approved: {
      type: Boolean,
      default: false,
    },
    suggestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    submits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Question = mongoose.model<IQuestion>("Question", QuestionSchema);
export default Question;
