import "reflect-metadata";
import {Container} from "typedi";
import {
    Body,
    Controller,
    Controllers,
    Get,
    NodeBoot,
    NodeBootApp,
    NodeBootApplication,
    NodeBootAppView,
    Post,
    Service,
} from "@nodeboot/core";
import {EnableDI} from "@nodeboot/di";
import {Exclude, Expose} from "class-transformer";
import {Logger} from "winston";
import {JsonObject} from "@nodeboot/context";
import {FastifyServer} from "@nodeboot/fastify-server";

@Exclude()
class UserModel {
    @Expose()
    firstName: string;

    lastName: string;
}

function handler(user: UserModel) {
    const ret = new UserModel();
    ret.firstName = user.firstName;
    ret.lastName = user.lastName || "default";
    return ret;
}

@Service()
export class ServiceA {
    doSomething() {
        return "Real ServiceA result";
    }
}

@Service()
export class ServiceN {
    doSomethingElse() {
        return "Real ServiceN result";
    }
}

export class NotService {
    doSomething() {
        return "Real NotService result";
    }
}

@Controller("/test")
class NoTransformResponseController {
    constructor(
        private readonly serviceA: ServiceA,
        private readonly serviceN: ServiceN,
        private readonly logger: Logger,
    ) {}

    @Get("/ping")
    ping() {
        this.logger.debug("Ping to services");
        return {
            serviceA: this.serviceA.doSomething(),
            serviceN: this.serviceN.doSomethingElse(),
        };
    }

    @Post("/default")
    default(@Body() user: UserModel) {
        this.logger.debug("Getting default");
        return handler(user);
    }

    @Post("/noTransform", {transformRequest: false, transformResponse: false})
    noTransform(@Body() user: UserModel) {
        this.logger.debug("call noTransform");
        return handler(user);
    }

    @Post("/transformRequestOnly", {transformRequest: true, transformResponse: false})
    transformRequestOnly(@Body() user: UserModel) {
        this.logger.debug("call transformRequestOnly");
        return handler(user);
    }

    @Post("/transformResponseOnly", {transformRequest: false, transformResponse: true})
    transformResponseOnly(@Body() user: UserModel) {
        this.logger.debug("call transformResponseOnly");
        return handler(user);
    }
}

@EnableDI(Container)
@NodeBootApplication()
@Controllers([NoTransformResponseController])
export class TestApp implements NodeBootApp {
    start(additionalConfig?: JsonObject): Promise<NodeBootAppView> {
        return NodeBoot.run(FastifyServer, additionalConfig);
    }
}
