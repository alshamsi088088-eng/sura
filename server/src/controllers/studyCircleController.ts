import { Request, Response } from 'express';
import * as studyCircleService from '../services/studyCircleService.js';

/**
 * Study Circle controller — REST handlers for /api/study-circles.
 * Follows existing controller conventions: validate input, call service,
 * return JSON. Errors from services are mapped to appropriate HTTP codes.
 */

export async function createCircle(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { title, description, category } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const circle = await studyCircleService.createCircle({
      creatorId: userId,
      title,
      description,
      category,
    });
    res.status(201).json(circle);
  } catch (error) {
    console.error('Create circle error:', error);
    res.status(500).json({ error: 'Failed to create circle' });
  }
}

export async function getCircles(req: Request, res: Response) {
  try {
    const { search, page, limit } = req.query;
    const result = await studyCircleService.getCircles({
      search: search as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('Get circles error:', error);
    res.status(500).json({ error: 'Failed to fetch circles' });
  }
}

export async function getCircle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const circle = await studyCircleService.getCircle(id);
    if (!circle) return res.status(404).json({ error: 'Circle not found' });
    res.json(circle);
  } catch (error) {
    console.error('Get circle error:', error);
    res.status(500).json({ error: 'Failed to fetch circle' });
  }
}

export async function joinCircle(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const member = await studyCircleService.joinCircle(id, userId);
    res.json(member);
  } catch (error) {
    console.error('Join circle error:', error);
    res.status(500).json({ error: 'Failed to join circle' });
  }
}

export async function leaveCircle(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const result = await studyCircleService.leaveCircle(id, userId);
    res.json(result);
  } catch (error: any) {
    if (error?.message === 'Owner cannot leave the circle; transfer ownership first') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Leave circle error:', error);
    res.status(500).json({ error: 'Failed to leave circle' });
  }
}

export async function getMembers(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const members = await studyCircleService.getMembers(id);
    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
}

export async function setModerator(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });

    const result = await studyCircleService.setModerator({
      circleId: id,
      actorId: userId,
      targetUserId,
    });
    res.json(result);
  } catch (error: any) {
    if (error?.message === 'Only owner/moderator can assign moderators') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Set moderator error:', error);
    res.status(500).json({ error: 'Failed to set moderator' });
  }
}

export async function getSchedule(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const schedule = await studyCircleService.getSchedule(id);
    res.json(schedule);
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
}

export async function updateSchedule(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const { dayOfWeek, timeOfDay, timezone } = req.body;
    if (!dayOfWeek) return res.status(400).json({ error: 'dayOfWeek is required' });

    const schedule = await studyCircleService.updateSchedule({
      circleId: id,
      actorId: userId,
      dayOfWeek: parseInt(dayOfWeek),
      timeOfDay: timeOfDay || '18:00',
      timezone: timezone || 'UTC',
    });
    res.json(schedule);
  } catch (error: any) {
    if (error?.message === 'dayOfWeek must be between 1 and 7') {
      return res.status(400).json({ error: error.message });
    }
    if (error?.message === 'Only circle moderators can perform this action') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
}

// ─── Goals ─────────────────────────────────────────────────────────────────

export async function createGoal(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const { title, description, target, week } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!week) return res.status(400).json({ error: 'week is required' });

    const goal = await studyCircleService.createGoal({
      circleId: id,
      createdBy: userId,
      title,
      description,
      target: target ? parseInt(target) : 1,
      week,
    });
    res.status(201).json(goal);
  } catch (error: any) {
    if (error?.message === 'Not a member of this circle') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
}

export async function updateGoalProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { goalId } = req.params;
    const { progress } = req.body;
    if (progress === undefined) return res.status(400).json({ error: 'progress is required' });

    const goal = await studyCircleService.updateGoalProgress({
      goalId,
      userId,
      progress: parseInt(progress),
    });
    res.json(goal);
  } catch (error: any) {
    if (error?.message === 'Goal not found') return res.status(404).json({ error: error.message });
    if (
      error?.message === 'Only the goal creator or a moderator can update this goal' ||
      error?.message === 'Not a member of this circle'
    ) {
      return res.status(403).json({ error: error.message });
    }
    console.error('Update goal progress error:', error);
    res.status(500).json({ error: 'Failed to update goal progress' });
  }
}

export async function getGoals(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { week } = req.query;
    const goals = await studyCircleService.getGoals(id, week as string | undefined);
    res.json({ goals });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
}

// ─── Notes ─────────────────────────────────────────────────────────────────

export async function createNote(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

    const note = await studyCircleService.createNote({
      circleId: id,
      authorId: userId,
      title,
      content,
    });
    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
}

export async function updateNote(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { noteId } = req.params;
    const { title, content } = req.body;

    const note = await studyCircleService.updateNote({
      noteId,
      authorId: userId,
      title,
      content,
    });
    res.json(note);
  } catch (error: any) {
    if (error?.message === 'Only the author can edit this note') {
      return res.status(403).json({ error: error.message });
    }
    if (error?.message === 'Note not found') return res.status(404).json({ error: error.message });
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
}

export async function deleteNote(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { noteId } = req.params;
    const result = await studyCircleService.deleteNote({ noteId, authorId: userId });
    res.json(result);
  } catch (error: any) {
    if (error?.message === 'Only the author can delete this note') {
      return res.status(403).json({ error: error.message });
    }
    if (error?.message === 'Note not found') return res.status(404).json({ error: error.message });
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
}

// ─── Assignments ───────────────────────────────────────────────────────────

export async function createAssignment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const { title, description, dueDate } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

    const assignment = await studyCircleService.createAssignment({
      circleId: id,
      createdBy: userId,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
}

export async function getAssignments(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const assignments = await studyCircleService.getAssignments(id);
    res.json({ assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
}

export async function submitAssignment(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { assignmentId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const submission = await studyCircleService.submitAssignment({
      assignmentId,
      userId,
      content,
    });
    res.status(201).json(submission);
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
}

export async function scoreSubmission(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Authentication required' });

    const { submissionId } = req.params;
    const { score } = req.body;
    if (score === undefined) return res.status(400).json({ error: 'score is required' });

    const submission = await studyCircleService.scoreSubmission({
      submissionId,
      score: parseInt(score),
      actorId: user.id,
      actorRole: user.role,
    });
    res.json(submission);
  } catch (error: any) {
    if (error?.message === 'Only circle moderators can score submissions') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Score submission error:', error);
    res.status(500).json({ error: 'Failed to score submission' });
  }
}

// ─── Calendar ──────────────────────────────────────────────────────────────

export async function getCalendar(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const calendar = await studyCircleService.getCalendar(id);
    res.json(calendar);
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
}
