"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, BarChart3, Sparkles, Crown, Lock, Heart, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Vote } from "@/app/page"
import type { Category } from "@/lib/categories"

interface ResultsSectionProps {
  votes: Vote[]
  categories: Category[]
  leadershipRevealed: boolean
  isSuperAdmin: boolean
  onRevealLeadership: () => void
}

export function ResultsSection({
  votes,
  categories,
  leadershipRevealed,
  isSuperAdmin,
  onRevealLeadership,
}: ResultsSectionProps) {
  const [showLeadershipReveal, setShowLeadershipReveal] = useState(false)

  const getResultsForCategory = (categoryId: string) => {
    const categoryVotes = votes.filter((v) => v.categoryId === categoryId)
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return []

    const voteCounts: Record<string, number> = {}
    category.candidates.forEach((candidate) => {
      voteCounts[candidate.name] = 0
    })

    categoryVotes.forEach((vote) => {
      if (voteCounts[vote.candidateName] !== undefined) {
        voteCounts[vote.candidateName]++
      }
    })

    const totalVotes = categoryVotes.length

    return Object.entries(voteCounts)
      .map(([name, count]) => {
        const candidate = category.candidates.find((c) => c.name === name)
        return {
          name,
          votes: count,
          percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
          image: candidate?.image || "",
        }
      })
      .sort((a, b) => b.votes - a.votes)
  }

  const totalVotes = votes.length
  const uniqueVoters = new Set(votes.map((v) => v.userId)).size

  const leadershipPrize = categories.find((c) => c.isLeadershipPrize)

  const handleRevealClick = () => {
    if (isSuperAdmin && !leadershipRevealed) {
      onRevealLeadership()
    }
    if (leadershipRevealed || isSuperAdmin) {
      setShowLeadershipReveal(true)
    }
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Résultats des votes
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Classement par catégorie - Mise à jour en temps réel
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalVotes}</div>
              <div className="text-sm text-muted-foreground">Votes totaux</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{uniqueVoters}</div>
              <div className="text-sm text-muted-foreground">Participants</div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {categories
            .filter((c) => !c.isLeadershipPrize)
            .map((category, index) => {
              const results = getResultsForCategory(category.id)
              const totalCategoryVotes = results.reduce((sum, r) => sum + r.votes, 0)

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{totalCategoryVotes} votes</p>
                    </div>
                  </div>

                  {results.length > 0 && totalCategoryVotes > 0 ? (
                    <div className="space-y-4">
                      {results.map((result, idx) => (
                        <motion.div
                          key={result.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {result.image && (
                                <img
                                  src={result.image || "/placeholder.svg"}
                                  alt={result.name}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-border"
                                />
                              )}
                              {idx === 0 && totalCategoryVotes > 0 && <Crown className="w-5 h-5 text-primary" />}
                              <span className="font-medium">{result.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-primary">
                              {result.votes} votes ({result.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${result.percentage}%` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                              className={`h-full rounded-full ${
                                idx === 0 ? "bg-gradient-to-r from-primary to-accent" : "bg-muted-foreground/30"
                              }`}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun vote pour le moment</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
        </div>

        {/* Leadership Prize Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", bounce: 0.3 }}
          className="mt-12"
        >
          <motion.div
            className="bg-gradient-to-br from-amber-500/10 via-orange-600/10 to-amber-500/5 border border-amber-500/20 rounded-3xl p-8 text-center relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full bg-amber-500/10"
                  style={{
                    left: `${10 + (i * 12)}%`,
                    top: `${20 + (i % 3) * 30}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
              className="relative inline-block mb-6"
            >
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Number.POSITIVE_INFINITY, 
                  ease: "easeInOut" 
                }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30 relative"
              >
                <motion.div
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-amber-300/30 to-orange-400/30 rounded-3xl"
                />
                <Trophy className="w-10 h-10 text-white relative z-10" />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-3xl font-bold mb-3 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 bg-clip-text text-transparent"
            >
              Trophée Leadership
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-muted-foreground mb-8 text-lg"
            >
              Prix hommage en l'honneur de Kassim Guindo
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {leadershipRevealed ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleRevealClick}
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 px-8 py-4 text-lg font-semibold transition-all duration-300"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="mr-3"
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Voir l'hommage à Kassim
                  </Button>
                </motion.div>
              ) : isSuperAdmin ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleRevealClick}
                    size="lg"
                    className="bg-gradient-to-r from-red-500 via-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 px-8 py-4 text-lg font-semibold transition-all duration-300"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Number.POSITIVE_INFINITY, 
                        ease: "easeInOut" 
                      }}
                      className="mr-3"
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Révéler le Trophée Leadership
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex items-center justify-center gap-3 text-muted-foreground bg-muted/30 rounded-full px-6 py-3 border border-amber-500/20"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Lock className="w-5 h-5 text-amber-500" />
                  </motion.div>
                  <span className="text-base font-medium">
                    Ce prix sera révélé lors de la cérémonie officielle
                  </span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Leadership Revelation Modal */}
      <AnimatePresence>
        {showLeadershipReveal && leadershipPrize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-amber-900/20 via-orange-900/20 to-background/95 backdrop-blur-2xl flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowLeadershipReveal(false)}
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-amber-500/20"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -100, 0],
                    opacity: [0, 1, 0],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: Math.random() * 2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
              transition={{ 
                type: "spring", 
                bounce: 0.4, 
                duration: 0.8,
                staggerChildren: 0.1
              }}
              className="relative bg-gradient-to-br from-card via-card to-card border border-amber-500/30 rounded-3xl p-6 sm:p-10 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: "0 25px 50px -12px rgba(251, 191, 36, 0.25), 0 0 100px rgba(251, 191, 36, 0.1)"
              }}
            >
              {/* Close button */}
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setShowLeadershipReveal(false)}
                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-muted/80 to-muted/60 flex items-center justify-center hover:from-muted hover:to-muted/80 transition-all duration-300 hover:scale-110 border border-amber-500/20 z-10"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Header with trophy animation */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                  className="relative inline-block mb-6"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -15, 0], 
                      rotate: [0, 3, -3, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Number.POSITIVE_INFINITY, 
                      ease: "easeInOut" 
                    }}
                    className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/40 relative overflow-hidden"
                  >
                    {/* Animated glow effect */}
                    <motion.div
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 bg-gradient-to-br from-amber-300/30 to-orange-400/30 rounded-3xl"
                    />
                    <Trophy className="w-16 h-16 text-white relative z-10" />
                  </motion.div>
                  {/* Floating sparkles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-amber-400 rounded-full"
                      style={{
                        top: "50%",
                        left: "50%",
                      }}
                      animate={{
                        x: [0, Math.cos(i * 60 * Math.PI / 180) * 60, 0],
                        y: [0, Math.sin(i * 60 * Math.PI / 180) * 60, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: i * 0.5,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, type: "spring", bounce: 0.3 }}
                  className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 bg-clip-text text-transparent"
                >
                  Trophée Leadership
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground text-lg"
                >
                  Prix hommage - BANKASS AWARDS
                </motion.p>
              </div>

              {/* Kassim Profile */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-2xl p-6 mb-6 border border-amber-500/20"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.7, type: "spring", bounce: 0.4 }}
                    className="relative"
                  >
                    <motion.img
                      src={
                        leadershipPrize.preAssignedWinnerImage ||
                        "/placeholder.svg?height=150&width=150&query=african leader portrait distinguished"
                      }
                      alt={leadershipPrize.preAssignedWinner}
                      className="w-40 h-40 rounded-2xl object-cover border-4 border-amber-500/30 shadow-2xl shadow-amber-500/20"
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Decorative frame */}
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="absolute -inset-2 border-2 border-amber-500/20 rounded-2xl"
                    />
                  </motion.div>
                  <div className="text-center sm:text-left flex-1">
                    <motion.h3
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8, type: "spring", bounce: 0.3 }}
                      className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 bg-clip-text text-transparent mb-2"
                    >
                      {leadershipPrize.preAssignedWinner}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="text-amber-500 font-semibold text-lg mb-2"
                    >
                      Lauréat du Trophée Leadership
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/30"
                    >
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        Hommage à Kassim Guindo
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* Biography */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="bg-card/50 rounded-xl p-6 border border-amber-500/10"
                >
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-500">
                    <Heart className="w-5 h-5" />
                    Biographie
                  </h4>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-muted-foreground leading-relaxed text-base"
                  >
                    {leadershipPrize.preAssignedWinnerBio}
                  </motion.p>
                </motion.div>

                {/* Achievements */}
                {leadershipPrize.preAssignedWinnerAchievements && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    className="bg-card/50 rounded-xl p-6 border border-amber-500/10"
                  >
                    <motion.h4
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 }}
                      className="font-semibold mb-4 flex items-center gap-2 text-amber-500 text-lg"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      >
                        <Crown className="w-6 h-6" />
                      </motion.div>
                      Réalisations exceptionnelles
                    </motion.h4>
                    <ul className="space-y-3">
                      {leadershipPrize.preAssignedWinnerAchievements.map((achievement, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.5 + i * 0.1, type: "spring", bounce: 0.2 }}
                          whileHover={{ x: 10 }}
                          className="flex items-center gap-3 text-muted-foreground bg-gradient-to-r from-amber-500/5 to-transparent p-3 rounded-lg border-l-4 border-amber-500/30"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.6 + i * 0.1, type: "spring" }}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                          <span className="text-base">{achievement}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>

              {/* Tribute */}
              {leadershipPrize.preAssignedWinnerTribute && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 }}
                  className="bg-gradient-to-br from-red-500/5 via-amber-500/5 to-orange-500/5 rounded-2xl p-6 border border-amber-500/20 relative overflow-hidden"
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-xl" />
                  
                  <div className="relative z-10">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.9 }}
                      className="flex items-center gap-3 mb-6"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Number.POSITIVE_INFINITY, 
                          ease: "easeInOut" 
                        }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center"
                      >
                        <Heart className="w-5 h-5 text-white" />
                      </motion.div>
                      <h4 className="font-bold text-xl bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                        Hommage éternel
                      </h4>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2 }}
                      className="text-muted-foreground text-base leading-relaxed whitespace-pre-line italic font-medium"
                    >
                      {leadershipPrize.preAssignedWinnerTribute}
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Close button */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="mt-8 text-center"
              >
                <Button
                  onClick={() => setShowLeadershipReveal(false)}
                  className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white px-8 py-3 text-lg font-semibold shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 hover:scale-105"
                >
                  Fermer l'hommage
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
