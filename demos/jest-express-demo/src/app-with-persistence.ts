import "reflect-metadata";
import {Container} from "typedi";
import {
    Body,
    ClassToPlainTransform,
    Controller,
    Controllers,
    Delete,
    EnableClassTransformer,
    Get,
    NodeBoot,
    NodeBootApp,
    NodeBootApplication,
    NodeBootAppView,
    Param,
    PlainToClassTransform,
    Post,
    Service,
} from "@nodeboot/core";
import {EnableDI} from "@nodeboot/di";
import {Logger} from "winston";
import {JsonObject} from "@nodeboot/context";
import {Column, Entity, PrimaryGeneratedColumn, Repository} from "typeorm";
import {
    DataRepository,
    DatasourceConfiguration,
    EnableRepositories,
    Transactional,
} from "@nodeboot/starter-persistence";
import {IsEmail, IsNotEmpty, IsString, MaxLength, MinLength} from "class-validator";
import {HttpError} from "@nodeboot/error";
import {ExpressServer} from "@nodeboot/express-server";

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({nullable: true})
    name?: string; // New field
}

export class UserModel {
    @IsEmail()
    public email: string;

    @IsString()
    public name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(9)
    @MaxLength(32)
    public password: string;
}

@DataRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {}

@Service()
export class UserService {
    constructor(private readonly logger: Logger, private readonly userRepository: UserRepository) {}

    public async findAllUser(): Promise<UserEntity[]> {
        this.logger.debug("Getting all users");
        return this.userRepository.find();
    }

    public async getUserById(id: string): Promise<UserEntity> {
        this.logger.debug(`Getting user for ID ${id}`);
        return {
            id,
            name: `User ${id}`,
            email: "user@nodeboot.io",
            password: "encrypted",
        };
    }

    @Transactional()
    public async createUser(userData: UserModel): Promise<UserEntity> {
        const existingUser = await this.userRepository.findOneBy({
            email: userData.email,
        });

        optionalOf(existingUser).ifPresentThrow(
            () => new HttpError(409, `This email ${userData.email} already exists`),
        );

        return this.userRepository.save(userData);
    }

    @Transactional()
    public async deleteUser(userId: string): Promise<void> {
        const user = await this.userRepository.findOneBy({
            id: userId,
        });

        optionalOf(user).orElseThrow(() => new HttpError(409, "User doesn't exist"));

        await this.userRepository.delete({id: userId});

        throw new Error("Error after deleting that should rollback transaction");
    }
}

@Controller("/users")
class UserController {
    constructor(private readonly userService: UserService) {}

    @Get("/:id")
    async getById(@Param("id") userId: string): Promise<UserEntity> {
        return this.userService.getUserById(userId);
    }

    @Get("/")
    async getUsers(): Promise<UserEntity[]> {
        return this.userService.findAllUser();
    }

    @Post("/")
    async createUser(@Body() userData: UserModel): Promise<UserEntity> {
        return this.userService.createUser(userData);
    }

    @Delete("/:id")
    async deleteUser(@Param("id") userId: string) {
        await this.userService.deleteUser(userId);
        return {message: `User ${userId} successfully deleted`};
    }
}

@DatasourceConfiguration({
    type: "better-sqlite3",
    database: ":memory:",
    synchronize: true,
    migrationsRun: false,
})
export class TestDatasourceConfiguration {}

@EnableClassTransformer({enabled: false})
@ClassToPlainTransform({
    strategy: "exposeAll",
})
@PlainToClassTransform({
    strategy: "exposeAll",
})
export class ClassTransformConfiguration {}

@EnableDI(Container)
@NodeBootApplication()
@Controllers([UserController])
@EnableRepositories()
export class TestAppWithPersistence implements NodeBootApp {
    start(additionalConfig?: JsonObject): Promise<NodeBootAppView> {
        return NodeBoot.run(ExpressServer, additionalConfig);
    }
}
