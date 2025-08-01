// This file is used to mock dependencies for testing
module.exports = {
  auctionQueue: {
    add: jest.fn().mockResolvedValue(null)
  }
};
