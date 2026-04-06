import api from "./axios";
import { Course, Chapter, Quiz } from "../types/course";

// Get all courses
export const getAllCourses = async () => {
  const response = await api.get<Course[]>("/courses");
  return response.data;
};

// Get user's courses with progress
export const getUserCourses = async () => {
  const response = await api.get<Course[]>("/courses/user");
  return response.data;
};

// Get a single course by ID
export const getCourseById = async (id: string) => {
  const response = await api.get<Course>(`/courses/${id}`);
  return response.data;
};

// Get a chapter by ID
export const getChapterById = async (courseId: string, chapterId: string) => {
  const response = await api.get<Chapter>(`/courses/${courseId}/chapters/${chapterId}`);
  return response.data;
};

// Mark a chapter as completed
export const markChapterCompleted = async (courseId: string, chapterId: string) => {
  const response = await api.post(`/courses/${courseId}/chapters/${chapterId}/complete`);
  return response.data;
};

// Submit quiz answers
export const submitQuizAnswers = async (
  courseId: string,
  chapterId: string,
  answers: Record<string, number>
) => {
  const response = await api.post(`/courses/${courseId}/chapters/${chapterId}/quiz`, { answers });
  return response.data;
};

// Admin: Create a new course
export const createCourse = async (courseData: Omit<Course, "id">) => {
  const response = await api.post<Course>("/admin/courses", courseData);
  return response.data;
};

// Admin: Update an existing course
export const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
  const response = await api.put<Course>(`/admin/courses/${courseId}`, courseData);
  return response.data;
};

// Admin: Delete a course
export const deleteCourse = async (courseId: string) => {
  const response = await api.delete(`/admin/courses/${courseId}`);
  return response.data;
};

// Enroll in a course with enrollment code
export const enrollInCourse = async (courseId: string, enrollmentCode: string) => {
  const response = await api.post(`/courses/${courseId}/enroll`, { enrollmentCode });
  return response.data;
};
