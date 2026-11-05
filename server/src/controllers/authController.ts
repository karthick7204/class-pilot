import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'attendwise_super_secure_jwt_secret_key_987654321';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, studentId, email, password, targetPercentage, collegeName, department, semester } = req.body;

      if (!name || !studentId || !email || !password) {
        res.status(400).json({ error: 'Name, Student ID, Email, and Password are required.' });
        return;
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: email.toLowerCase().trim() }, { studentId: studentId.trim() }],
        },
      });

      if (existingUser) {
        res.status(409).json({ error: 'An account with this email or student ID already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          studentId: studentId.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          targetPercentage: targetPercentage ? Number(targetPercentage) : 75.0,
          collegeName: collegeName?.trim() || 'SRM Institute of Science & Technology',
          department: department?.trim() || 'Computer Science & Engineering',
          semester: semester ? Number(semester) : 5,
        },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, studentId: user.studentId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Account created successfully.',
        token,
        user: {
          id: user.id,
          name: user.name,
          studentId: user.studentId,
          email: user.email,
          targetPercentage: user.targetPercentage,
          collegeName: user.collegeName,
          department: user.department,
          semester: user.semester,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Failed to register student account.' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { loginId, password } = req.body;

      if (!loginId || !password) {
        res.status(400).json({ error: 'Student ID / Email and password are required.' });
        return;
      }

      const cleanLogin = loginId.trim().toLowerCase();
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: cleanLogin }, { studentId: cleanLogin.replace(/@.*$/, '') }],
        },
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials. No student account found with this ID/Email.' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, studentId: user.studentId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          name: user.name,
          studentId: user.studentId,
          email: user.email,
          targetPercentage: user.targetPercentage,
          collegeName: user.collegeName,
          department: user.department,
          semester: user.semester,
        },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'An unexpected error occurred during login.' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          studentId: true,
          email: true,
          targetPercentage: true,
          collegeName: true,
          department: true,
          semester: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      res.json({ user });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
  }
}

