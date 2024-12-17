"use server";
import { LoginSchema, RegisterSchema } from "@/schemas/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getUserByEmail } from "@/lib/utils";
import { signIn } from "@/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/routeRule";
import { AuthError } from "next-auth";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const safeValues = LoginSchema.safeParse(values);
  if (!safeValues.success) {
    return { error: "Invalid email or password" };
  }

  const { email, password } = safeValues.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      switch (e.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw e;
  }
};

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const safeValues = RegisterSchema.safeParse(values);
  if (!safeValues.success) {
    return { error: "Invalid email or password" };
  }
  const { email, password, name } = safeValues.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);
  console.log("Exisint User", existingUser);

  if (existingUser) {
    return { error: "User already exists" };
  }

  try {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      switch (e.code) {
        case "P1001":
          return { error: "Failed to Connect to DB" };

        default:
          return { error: "Something went wrong" };
      }
    }
    return { error: "Something went wrong" };
  }

  return { success: "Login successful" };
};
