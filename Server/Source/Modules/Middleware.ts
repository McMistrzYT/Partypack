import { NextFunction, Request, Response } from "express";
import { User } from "../Schemas/User";
import { JwtPayload, verify } from "jsonwebtoken";
import { IS_DEBUG, JWT_KEY } from "./Constants";
import j from "joi";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export function OptionalAuthentication(Relations?: object) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.header("X-Partypack-Token") && !req.cookies["Token"] && !req.header("Authorization"))
            return next();

        let JWT: JwtPayload;
        try {
            JWT = verify(req.header("X-Partypack-Token") ?? req.cookies["Token"] ?? req.header("Authorization"), JWT_KEY!) as JwtPayload;
        } catch (err) {
            console.error(err);
            return next();
        }

        const UserData = await User.findOne({ where: { ID: JWT.ID }, relations: Relations });
        if (!UserData)
            return next();

        req.user = UserData;
        next();
    }
}

export function RequireAuthentication(Relations?: object) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.header("X-Partypack-Token") && !req.cookies["Token"] && !req.header("Authorization"))
            return res.status(401).send("You must be logged in to perform this action.");

        let JWT: JwtPayload;
        try {
            JWT = verify(req.header("X-Partypack-Token") ?? req.cookies["Token"] ?? req.header("Authorization"), JWT_KEY!) as JwtPayload;
        } catch (err) {
            console.error(err);
            return res.status(403).send(`Invalid Partypack token provided.${IS_DEBUG ? ` (${err})` : ""}`);
        }

        const UserData = await User.findOne({ where: { ID: JWT.ID }, relations: Relations });
        if (!UserData)
            return res.status(401).send("Invalid Partypack token provided. User does not exist in database. Please contact an instance admin.");

        req.user = UserData;
        next();
    }
}

export function ValidateBody(Schema: j.Schema) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = await Schema.validateAsync(req.body);
            next();
        } catch (err) {
            res.status(400).json(err)
        }
    }
}

export function ValidateQuery(Schema: j.Schema) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.query = await Schema.validateAsync(req.query);
            next();
        } catch (err) {
            res.status(400).json(err)
        }
    }
}
