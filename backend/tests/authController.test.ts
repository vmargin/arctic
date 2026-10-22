import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../src/db/prisma';
import { login } from '../src/controllers/authController';
import { UnauthorizedError } from '../src/middleware/errorHandler';

jest.mock('../src/db/prisma', () => ({
    __esModule: true,
    default: { user: { findUnique: jest.fn() } },
}));

describe('login enumeration resistance', () => {
    it('does real bcrypt work for a missing account and returns the same denial', async () => {
        const previousSecret = process.env.JWT_SECRET;
        process.env.JWT_SECRET = 'unit-test-only-secret-with-at-least-32-characters';
        const compare = jest.spyOn(bcrypt, 'compare');
        const lookup = prisma.user.findUnique as jest.Mock;
        lookup.mockResolvedValueOnce(null);
        try {
            await expect(login({ body: {
                email: 'missing@example.invalid', password: 'incorrect',
            } } as Request, {} as Response)).rejects.toThrow(UnauthorizedError);
            const hash = compare.mock.calls[0][1] as string;
            // bcrypt returns immediately for an invalid-length hash. A real hash
            // makes a missing account perform the same configured cost as login.
            expect(hash).toMatch(/^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/);
            expect(bcrypt.getRounds(hash)).toBe(10);
            expect(await compare.mock.results[0].value).toBe(false);
        } finally {
            compare.mockRestore();
            if (previousSecret === undefined) delete process.env.JWT_SECRET;
            else process.env.JWT_SECRET = previousSecret;
        }
    });
});
