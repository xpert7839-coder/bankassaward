"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HeroSection } from "@/components/hero-section"
import { AuthSection } from "@/components/auth-section"
import { VoteSection } from "@/components/vote-section"
import { ResultsSection } from "@/components/results-section"
import { ProfileSection } from "@/components/profile-section"
import { AdminSection } from "@/components/admin-section"
import { Navigation } from "@/components/navigation"
import { useUsers, useCategories, useVotes, useCurrentUser } from "@/hooks/use-api-data"
import type { User, Category, Vote } from "@/hooks/use-api-data"

export type UserRole = "VOTER" | "SUPER_ADMIN"

export type Page = "home" | "auth" | "vote" | "results" | "profile" | "admin"

const particlePositions = Array.from({ length: 20 }, (_, i) => ({
  x: (i * 137.5) % 100,
  y: (i * 73.13) % 100,
  duration: 10 + (i % 10),
  yOffset: -200 - (i % 5) * 100,
}))

const DEFAULT_SUPER_ADMIN: User = {
  id: "super_admin_001",
  name: "Super Admin",
  email: "admin@bankassawards.com",
  role: "SUPER_ADMIN",
  createdAt: new Date().toISOString(),
}

export default function BankassAwards() {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Récupérer la page sauvegardée depuis localStorage
    if (typeof window !== 'undefined') {
      const savedPage = localStorage.getItem("currentPage") as Page
      return savedPage || "home"
    }
    return "home"
  })
  const { currentUser, login, logout } = useCurrentUser()
  const { users, loading: usersLoading } = useUsers()
  const { categories, loading: categoriesLoading } = useCategories()
  const { votes, loading: votesLoading } = useVotes()
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [leadershipRevealed, setLeadershipRevealed] = useState<boolean>(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Le theme est stocké dans localStorage pour l'instant
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    // Sauvegarder la page actuelle dans localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("currentPage", currentPage)
    }
  }, [currentPage])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const handleLogout = () => {
    logout()
    setCurrentPage("home")
  }

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN"

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        isSuperAdmin={isSuperAdmin}
      />

      <AnimatePresence mode="wait">
        <motion.main
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {currentPage === "home" && <HeroSection setCurrentPage={setCurrentPage} currentUser={currentUser} />}
          {currentPage === "auth" && (
            <AuthSection
              setCurrentPage={setCurrentPage}
              setCurrentUser={(user) => user && login(user)}
            />
          )}
          {currentPage === "vote" && (
            <VoteSection
              currentUser={currentUser}
              setCurrentPage={setCurrentPage}
              categories={categories}
              leadershipRevealed={leadershipRevealed}
            />
          )}
          {currentPage === "results" && (
            <ResultsSection
              votes={votes}
              categories={categories}
              leadershipRevealed={leadershipRevealed}
              isSuperAdmin={isSuperAdmin}
              onRevealLeadership={() => setLeadershipRevealed(true)}
            />
          )}
          {currentPage === "profile" && (
            <ProfileSection
              currentUser={currentUser}
              votes={votes}
              setCurrentPage={setCurrentPage}
              categories={categories}
              users={users}
              setUsers={() => {}} // Les users sont gérés par le hook
            />
          )}
          {currentPage === "admin" && isSuperAdmin && (
            <AdminSection
              votes={votes}
              leadershipRevealed={leadershipRevealed}
              setLeadershipRevealed={setLeadershipRevealed}
              currentUser={currentUser}
            />
          )}
        </motion.main>
      </AnimatePresence>

      {isMounted && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          {particlePositions.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/10"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                y: [0, particle.yOffset],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: particle.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
