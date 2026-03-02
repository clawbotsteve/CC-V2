import { customAlphabet } from "nanoid";
import prismadb from "./prismadb";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 12;
const nanoid = customAlphabet(ALPHABET, CODE_LENGTH);

export const generateUniqueAffiliateString = async (): Promise<string> => {
  let code: string;
  let exists = true;

  do {
    code = nanoid();
    // Check if this affiliate string already exists in ReferralCode table
    const found = await prismadb.referralCode.findFirst({
      where: { referralCode: code },
    });
    exists = !!found;
  } while (exists);

  return code;
};

