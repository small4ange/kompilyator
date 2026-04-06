import React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { ProtectedRoute } from "./components/protected-route";
import { AdminRoute } from "./components/admin-route";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { Dashboard } from "./pages/dashboard";
import { CourseDetails } from "./pages/course-details";
import { ChapterContent } from "./pages/chapter-content";
import { ChapterQuiz } from "./pages/chapter-quiz";
import { AdminDashboard } from "./pages/admin/admin-dashboard";
import { AdminCourseCreate } from "./pages/admin/admin-course-create";
import { AdminCourseEdit } from "./pages/admin/admin-course-edit";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />
          <ProtectedRoute exact path="/dashboard" component={Dashboard} />
          <ProtectedRoute exact path="/courses/:courseId" component={CourseDetails} />
          <ProtectedRoute exact path="/courses/:courseId/chapters/:chapterId" component={ChapterContent} />
          <ProtectedRoute exact path="/courses/:courseId/chapters/:chapterId/quiz" component={ChapterQuiz} />
          <AdminRoute exact path="/admin" component={AdminDashboard} />
          <AdminRoute exact path="/admin/courses/create" component={AdminCourseCreate} />
          <AdminRoute exact path="/admin/courses/:courseId/edit" component={AdminCourseEdit} />
          <Route exact path="/">
            <Redirect to="/dashboard" />
          </Route>
        </Switch>
      </AuthProvider>
    </Router>
  );
}

export default App;