// errors.ts

// 基础业务错误
class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 网络/HTTP 错误
class NetworkError extends AppError {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "NetworkError";
    this.status = status;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

// 表单验证错误
class ValidationError extends AppError {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// 权限不足错误
class UnauthorizedError extends AppError {
  constructor(message = "无权访问") {
    super(message);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

// 数据不存在
class NotFoundError extends AppError {
  constructor(message = "资源未找到") {
    super(message);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

//消息队列查询超时错误
class TimeoutError extends AppError {
  constructor(message = "查询超时") {
    super(message);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export {
  AppError,
  NetworkError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  TimeoutError
};