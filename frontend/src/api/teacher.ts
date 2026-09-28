import { api } from "./client";
import type { CourseCard, TeacherStats } from "@/types";

export const teacherApi = {
  courses: async (): Promise<CourseCard[]> => (await api.get<CourseCard[]>("/teacher/courses")).data,

  stats: async (): Promise<TeacherStats> => (await api.get<TeacherStats>("/teacher/stats")).data,
};
