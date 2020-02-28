import { Request, Response } from "express";
import { Get, Controller, ClassWrapper } from "@overnightjs/core";
import asyncHandler from "express-async-handler";

@Controller("v1/webhooks")
@ClassWrapper(asyncHandler)
export class AdminController {
  @Get("organizations")
  async getOrganizations(req: Request, res: Response) {
    return res.json({ hello: "world" });
  }
}
