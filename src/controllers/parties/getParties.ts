import PartyModel from "../../models/Party.model";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function getParties(req: AuthRequest, res: Response) {
 const { search = "" } = req.query;
const { type } = req.body;

const trimmedSearch =
  typeof search === "string" ? search.trim() : "";
  try {
    
    const user = req.user as User

    // Build query
    const query: any = { user: new mongoose.Types.ObjectId(user.userId), type: type};
    if (trimmedSearch) {
      query.$or = [
        { name: { $regex: trimmedSearch, $options: "i" } },   // case-insensitive match on name
        { phone: { $regex: trimmedSearch, $options: "i" } },  // or phone match
      ];
    }

    // Fetch parties matching criteria
    const parties = await PartyModel.find(query)
      .select("name phone")   // select only fields needed for suggestions
      .limit(10)              // limit results for performance
      .lean();

    return res.status(200).json({ success: true, parties });
  } catch (error) {
    console.error("Error fetching parties:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch parties" });
  }
}
