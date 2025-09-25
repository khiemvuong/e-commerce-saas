
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: any;
    
    constructor(
        statusCode: number, 
        message: string, 
        isOperational = true, 
        details?: any
    )   {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this);
    }
}
// Not found error
export class notFoundError extends AppError {
    constructor(message = "Resource not Found"){
        super(404, message);
    }
}

// Validation error
export class ValidationError extends AppError {
    constructor(message = "Invalid request data", details?: any){
        super(400, message, true, details);
    }
}

//Authentication error
export class AuthError extends AppError {
    constructor(message = "Unauthorizes"){
        super(401, message);
    }
}

//Forbidden error
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden access"){
        super(403, message);
    }
}

//Database error
export class DatabaseError extends AppError {
    constructor(message = "Database error", details?: any){
        super(500, message, true, details);
    }
}

//Export rate limiting error
export class RateLimitError extends AppError {
    constructor(message = "Too many requests, please try again later"){
        super(429, message);
    }
}