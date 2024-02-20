import { Router } from "express";
import { RequireAuthentication, ValidateBody } from "../Modules/Middleware";
import j from "joi";

const App = Router();

App.get("/me",
RequireAuthentication(),
(req, res) => {
    res.json({
        SharingLibrary: req.user?.SharingLibrary
    });
})

App.post("/me/updatePreferences",
RequireAuthentication(),
ValidateBody(j.object({
    SharingLibrary: j.bool()
})),
async (req, res) => {
    req.user!.SharingLibrary = req.body.SharingLibrary;
    req.user!.save();
    res.sendStatus(200);
})

export default {
    App,
    DefaultAPI: "/api/privacy/"
}