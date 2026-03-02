import { customAlphabet } from "nanoid";
import prismadb from "./prismadb";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const nanoid = customAlphabet(ALPHABET, CODE_LENGTH);

export const generateUniqueReferralCode = async (): Promise<string> => {
  let code: string;
  let exists = true;

  do {
    code = `REF-${nanoid()}`;
    const found = await prismadb.referralCode.findUnique({
      where: { referralCode: code },
    });
    exists = !!found;
  } while (exists);

  return code;
};
