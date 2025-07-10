// Define a discriminated union for tool results for type safety
export type ToolSuccessResult<T> = { success: true; data: T; };
export type ToolErrorResult = { success: false; error: string; };
export type ToolResult<T> = ToolSuccessResult<T> | ToolErrorResult;
