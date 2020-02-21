import {Body, ClassSerializerInterceptor, Controller, Get, Param, Post, Req, UseGuards, UseInterceptors} from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";
import {Request} from "express";
import {StatusesService} from "./StatusesService";
import {StatusLikesService} from "./StatusLikesService";
import {CreateStatusRequest} from "./types/request";
import {StatusResponse} from "./types/response";
import {User} from "../users/entities";
import {OptionalJwtAuthGuard} from "../jwt-auth/OptionalJwtAuthGuard";

@Controller("api/v1/statuses")
export class StatusesController {
    constructor(private readonly statusesService: StatusesService,
                private readonly statusLikesService: StatusLikesService) {
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(AuthGuard("jwt"))
    @Post()
    public createStatus(@Body() createStatusRequest: CreateStatusRequest,
                        @Req() request: Request): Promise<StatusResponse> {
        return this.statusesService.createStatus(createStatusRequest, request.user as User)
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(OptionalJwtAuthGuard)
    @Get(":id")
    public findStatusById(@Param("id") id: string,
                          @Req() request: Request): Promise<StatusResponse> {
        return this.statusesService.findStatusById(id, request.user as User | null);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(AuthGuard("jwt"))
    @Post(":id/favourite")
    public likeStatus(@Param("id") id: string,
                      @Req() request: Request): Promise<StatusResponse> {
        return this.statusLikesService.createStatusLike(id, request.user as User);
    }

    @UseInterceptors(ClassSerializerInterceptor)
    @UseGuards(AuthGuard("jwt"))
    @Post(":id/unfavourite")
    public unlikeStatus(@Param("id") id: string,
                        @Req() request: Request): Promise<StatusResponse> {
        return this.statusLikesService.deleteStatusLike(id, request.user as User);
    }
}