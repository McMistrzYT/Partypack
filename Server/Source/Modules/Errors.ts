export interface ApiError {
    errorCode: string
    errorMessage: string
}

export const errorCode = Symbol("errorCode");

export abstract class ApiError {
    static [errorCode]?: string;
    static [Symbol.hasInstance](instance: unknown) {
        if (typeof instance !== "object" || instance === null) {
            return false;
        }

        if (!("errorCode" in instance) || !("errorMessage" in instance) || typeof instance.errorCode !== "string" || typeof instance.errorMessage !== "string") {
            return false;
        }

        if (this === ApiError) {
            return true;
        }

        if (!this[errorCode]) {
            this[errorCode] = new (this as any)().errorCode;
        }

        return this[errorCode] === instance.errorCode;
    }
}

const errorPrefix = `errors.dev.mcthe.partypacker`

export class InternalError extends ApiError {
    errorCode: string;
    errorMessage: string;
    
    constructor(errorMessage: string) {
        super();
        this.errorMessage = errorMessage;
        this.errorCode = `${errorPrefix}.internal_error`;
    }
    errorString() {
        return `${this.errorCode}: ${this.errorMessage}`;
    }

    errorJSON() {
        return {
            errorCode: this.errorCode,
            errorMessage: this.errorMessage
        };
    }
}

export class MissingPermissions extends ApiError {
    errorCode: string;
    errorMessage: string;

    constructor() {
        super();
        this.errorCode = `${errorPrefix}.missing_permissions`;
        this.errorMessage = "You don't have permission to access this endpoint.";
    }

    errorString() {
        return `${this.errorCode}: ${this.errorMessage}`;
    }

    errorJSON() {
        return {
            errorCode: this.errorCode,
            errorMessage: this.errorMessage
        };
    }
}

export class MisconfiguredDiscordBot extends ApiError {
    /*errorCode: string;
    errorMessage: string*/

    constructor() {
        super();
        this.errorCode = `${errorPrefix}.instance.invalid_discord_bot`;
        this.errorMessage = "This Partypack instance has a misconfigured Discord bot.";;
    }

    errorString() {
        return `${this.errorCode}: ${this.errorMessage}`;
    }

    errorJSON() {
        return {
            errorCode: this.errorCode,
            errorMessage: this.errorMessage
        };
    }
}

export class MissingServerRole extends ApiError {
    constructor() {
        super();
        this.errorCode = `${errorPrefix}.missing_discord_server_role`;
        this.errorMessage = "This role does not exist in the Discord server.";
    }

    errorString() {
        return `${this.errorCode}: ${this.errorMessage}`;
    }

    errorJSON() {
        return {
            errorCode: this.errorCode,
            errorMessage: this.errorMessage
        };
    }
}

export class MissingDatabaseRole extends ApiError {
    constructor() {
        super();
        this.errorCode = `${errorPrefix}.missing_database_role`;
        this.errorMessage = "This role does not exist in the database.";
    }

    errorString() {
        return `${this.errorCode}: ${this.errorMessage}`;
    }

    errorJSON() {
        return {
            errorCode: this.errorCode,
            errorMessage: this.errorMessage
        };
    }
}

//console.log(new MisconfiguredDiscordBot().errorJSON())