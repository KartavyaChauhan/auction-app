// jest.setup.js
jest.mock('../server', () => require('./mocks/socket.mock'));
jest.mock('../workers/auctionWorker', () => require('./mocks/auctionWorker.mock'));
