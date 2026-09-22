import { useEffect } from 'react'
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

function HistorySync() {
  const location = useLocation()
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history && window.location) {
      const fullPath = location.pathname + location.search + location.hash
      if (window.location.pathname + window.location.search + window.location.hash !== fullPath) {
        window.history.pushState(null, '', fullPath)
      }
    }
  }, [location])
  return null
}
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import Landing from './pages/Landing'
import ProfileSelect from './pages/child/ProfileSelect'
import { ChildLayout } from './pages/child/ChildLayout'
import Home from './pages/child/Home'
import ReadWithMe from './pages/child/ReadWithMe'
import LearnHome from './pages/child/LearnHome'
import SpeakPlay from './pages/child/SpeakPlay'
import Games from './pages/child/Games'
import GamePlay from './pages/child/GamePlay'
import Stories from './pages/child/Stories'
import StoryReader from './pages/child/StoryReader'
import MyPractice from './pages/child/MyPractice'
import Results from './pages/child/Results'
import MyJourney from './pages/child/MyJourney'
import Achievements from './pages/child/Achievements'
import Profile from './pages/child/Profile'
import Settings from './pages/child/Settings'
import TraceAndSpeak from './pages/child/TraceAndSpeak'
import LearningRunGame from './pages/child/LearningRunGame'
import SkyArcherGame from './pages/child/SkyArcherGame'
import CosmicMinerGame from './pages/child/CosmicMinerGame'
import CoralDiverGame from './pages/child/CoralDiverGame'
import MagicBakeryGame from './pages/child/MagicBakeryGame'
import DinoFossilGame from './pages/child/DinoFossilGame'
import CloudBouncerGame from './pages/child/CloudBouncerGame'
import VoxelCrafterGame from './pages/child/VoxelCrafterGame'
import SafariPhotoGame from './pages/child/SafariPhotoGame'
import AncientLabyrinthGame from './pages/child/AncientLabyrinthGame'
import SpiderWeaverGame from './pages/child/SpiderWeaverGame'
import StudentRegister from './pages/child/StudentRegister'

import ParentLogin from './pages/parent/Login'
import ParentRegister from './pages/parent/Register'
import ParentDashboard from './pages/parent/Dashboard'
import ParentProgress from './pages/parent/Progress'
import ParentFingerprint from './pages/parent/Fingerprint'
import ParentRecommendations from './pages/parent/Recommendations'
import ParentActivities from './pages/parent/Activities'
import ParentReports from './pages/parent/Reports'
import ParentSettings from './pages/parent/Settings'

import TeacherLogin from './pages/teacher/Login'
import TeacherRegister from './pages/teacher/Register'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherStudents from './pages/teacher/Students'
import TeacherStudentProfile from './pages/teacher/StudentProfile'
import TeacherClassProgress from './pages/teacher/ClassProgress'
import TeacherRecommendations from './pages/teacher/Recommendations'
import TeacherReports from './pages/teacher/Reports'
import TeacherSettings from './pages/teacher/Settings'

export default function App({
  initialRoute = (typeof window !== 'undefined' && window.location?.pathname ? window.location.pathname + window.location.search : '/'),
  initialAuth = null,
}) {
  return (
    <AuthProvider initialAuth={initialAuth}>
      <AppProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <HistorySync />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/select-profile" element={<ProfileSelect />} />
              <Route path="/child/register" element={<StudentRegister />} />
              <Route path="/register" element={<StudentRegister />} />

              {/* Top-level aliases for common route names — resolve to the
                  canonical /child/* routes so direct/deep links never 404
                  inside the app, even if something outside our control lands
                  a user on one of these paths. */}
              <Route path="/home" element={<Navigate to="/child/home" replace />} />
              <Route path="/learn" element={<Navigate to="/child/learn" replace />} />
              <Route path="/reading" element={<Navigate to="/child/read" replace />} />
              <Route path="/play" element={<Navigate to="/child/games" replace />} />
              <Route path="/stories" element={<Navigate to="/child/stories" replace />} />
              <Route path="/speak" element={<Navigate to="/child/speak" replace />} />
              <Route path="/profile" element={<Navigate to="/child/profile" replace />} />
              <Route path="/fingerprint" element={<Navigate to="/child/journey" replace />} />
              <Route path="/journey" element={<Navigate to="/child/journey" replace />} />
              <Route path="/achievements" element={<Navigate to="/child/achievements" replace />} />
              <Route path="/gaming-zone" element={<Navigate to="/child/games" replace />} />
              <Route path="/games/learning-run" element={<Navigate to="/child/games/learning-run" replace />} />
              <Route path="/games/sky-archer" element={<Navigate to="/child/games/sky-archer" replace />} />
              <Route path="/games/cosmic-miner" element={<Navigate to="/child/games/cosmic-miner" replace />} />
              <Route path="/games/coral-diver" element={<Navigate to="/child/games/coral-diver" replace />} />
              <Route path="/games/magic-bakery" element={<Navigate to="/child/games/magic-bakery" replace />} />
              <Route path="/games/dino-fossil" element={<Navigate to="/child/games/dino-fossil" replace />} />
              <Route path="/games/cloud-bouncer" element={<Navigate to="/child/games/cloud-bouncer" replace />} />
              <Route path="/games/voxel-crafter" element={<Navigate to="/child/games/voxel-crafter" replace />} />
              <Route path="/games/safari-photo" element={<Navigate to="/child/games/safari-photo" replace />} />
              <Route path="/games/ancient-labyrinth" element={<Navigate to="/child/games/ancient-labyrinth" replace />} />
              <Route path="/games/spider-weaver" element={<Navigate to="/child/games/spider-weaver" replace />} />

              {/* /child/* namespaced aliases — some external references use
                  this shape instead of the bare top-level ones above. */}
              <Route path="/child/play" element={<Navigate to="/child/games" replace />} />
              <Route path="/child/gaming-zone" element={<Navigate to="/child/games" replace />} />

              <Route path="/child" element={<ChildLayout />}>

                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<Home />} />
                <Route path="learn" element={<LearnHome />} />
                <Route path="read" element={<ReadWithMe />} />
                <Route path="speak" element={<SpeakPlay />} />
                <Route path="games" element={<Games />} />
                <Route path="games/spider-weaver" element={<SpiderWeaverGame />} />
                <Route path="games/learning-run" element={<LearningRunGame />} />
                <Route path="games/sky-archer" element={<SkyArcherGame />} />
                <Route path="games/cosmic-miner" element={<CosmicMinerGame />} />
                <Route path="games/coral-diver" element={<CoralDiverGame />} />
                <Route path="games/magic-bakery" element={<MagicBakeryGame />} />
                <Route path="games/dino-fossil" element={<DinoFossilGame />} />
                <Route path="games/cloud-bouncer" element={<CloudBouncerGame />} />
                <Route path="games/voxel-crafter" element={<VoxelCrafterGame />} />
                <Route path="games/safari-photo" element={<SafariPhotoGame />} />
                <Route path="games/ancient-labyrinth" element={<AncientLabyrinthGame />} />
                <Route path="games/:gameId" element={<GamePlay />} />
                <Route path="stories" element={<Stories />} />
                <Route path="stories/:storyId" element={<StoryReader />} />
                <Route path="practice" element={<MyPractice />} />
                <Route path="results" element={<Results />} />
                <Route path="journey" element={<MyJourney />} />
                <Route path="achievements" element={<Achievements />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="comfort" element={<Settings />} />
                <Route path="games/trace-speak" element={<TraceAndSpeak />} />
                <Route path="games/trace-say" element={<TraceAndSpeak />} />
              </Route>

              {/* Parent Routes */}
              <Route path="/parent/login" element={<ParentLogin />} />
              <Route path="/parent/register" element={<ParentRegister />} />
              <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']} loginPath="/parent/login" />}>
                <Route index element={<Navigate to="/parent/dashboard" replace />} />
                <Route path="dashboard" element={<ParentDashboard />} />
                <Route path="progress" element={<ParentProgress />} />
                <Route path="fingerprint" element={<ParentFingerprint />} />
                <Route path="errors" element={<Navigate to="/parent/recommendations" replace />} />
                <Route path="recommendations" element={<ParentRecommendations />} />
                <Route path="history" element={<Navigate to="/parent/activities" replace />} />
                <Route path="activities" element={<ParentActivities />} />
                <Route path="reports" element={<ParentReports />} />
                <Route path="settings" element={<ParentSettings />} />
              </Route>

              {/* Teacher Routes */}
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher/register" element={<TeacherRegister />} />
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']} loginPath="/teacher/login" />}>
                <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="students/:studentId" element={<TeacherStudentProfile />} />
                <Route path="progress" element={<TeacherClassProgress />} />
                <Route path="analytics" element={<Navigate to="/teacher/progress" replace />} />
                <Route path="recommendations" element={<TeacherRecommendations />} />
                <Route path="reports" element={<TeacherReports />} />
                <Route path="settings" element={<TeacherSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </MemoryRouter>
      </AppProvider>
    </AuthProvider>
  )
}
