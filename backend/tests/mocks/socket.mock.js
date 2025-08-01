// This file is used to mock dependencies for testing
module.exports = {
  io: {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis()
  }
};
