"use server";

import { db } from "@/db/index";
import {Account, account} from "@/db/schema";
import { eq } from "drizzle-orm";


// CRUD - CREATE, READ, UPDATE, DELETE
export async function getUsers() {
    try {
        const allUsers = await db.select().from(account);
        return allUsers;
    } catch (error) {
        console.error(error);
        throw {error: "Failed to get users."};
    }
}

export async function createUser(user: Account) {
    try {
        const newUser = await db.insert(account).values(user);
        return newUser;
    } catch (error) {
        console.error(error);
        return {error: "Failed to create user."};
    }
}

export async function updateUser(user: Account) {
    try {
        const updateUser = await db.update(account).set(user).where(eq(account.id, user.id));
        return updateUser;
    } catch (error) {
        console.error(error);
        return {error: "Failed to update user."};
    }
}

export async function deleteUser(user: Account) {
    try {
        const deleteUser = await db.delete(account).where(eq(account.id, user.id));
        return deleteUser;
    } catch (error) {
        console.error(error);
        return {error: "Failed to delete user."};
    }
}

// OUTROS
export async function getUserById(id: number) {
    const userById = await db.select().from(account);
    return userById;
}