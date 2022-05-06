/**
 * Represents an error case in which a resource is not found.
 */
class ErrorNotFound extends Error {
  /**
   * Construct an error object.
   *
   * @param {String} message Error message.
   */
  constructor(message) {
    super(message);

    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export {ErrorNotFound};
