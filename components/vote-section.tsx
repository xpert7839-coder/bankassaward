"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Vote as VoteIcon, AlertCircle, Trophy, Sparkles, ChevronDown, X, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AudioPreview } from "@/components/audio-preview"
import type { User, Vote } from "@/hooks/use-api-data"
import type { Category, Candidate } from "@/lib/categories"
import { useVotes } from "@/hooks/use-api-data"

import type { Page } from "@/app/page"

interface VoteSectionProps {
  currentUser: User | null
  setCurrentPage: (page: Page) => void
  categories: Category[]
  leadershipRevealed: boolean
}

export function VoteSection({
  currentUser,
  setCurrentPage,
  categories,
  leadershipRevealed,
}: VoteSectionProps) {
  const { votes, refetch: refetchVotes } = useVotes()
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, { id: string; name: string }>>({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [selectedProfile, setSelectedProfile] = useState<{ candidate: Candidate; categoryId: string } | null>(null)

  if (!currentUser) {
    return (
      <section className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Connexion requise</h2>
          <p className="text-muted-foreground mb-6">
            Vous devez être connecté pour voter. Créez un compte ou connectez-vous pour participer.
          </p>
          <Button
            onClick={() => setCurrentPage("auth")}
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
          >
            Se connecter
          </Button>
        </motion.div>
      </section>
    )
  }

  const hasUserVotedInCategory = (categoryId: string) => {
    return votes.some((v) => v.userId === currentUser.id && v.categoryId === categoryId)
  }

  const getUserVoteInCategory = (categoryId: string) => {
    return votes.find((v) => v.userId === currentUser.id && v.categoryId === categoryId)
  }

  const handleVote = async (categoryId: string, candidate?: { id: string; name: string }) => {
    const finalCandidate = candidate || selectedCandidates[categoryId]

    if (!finalCandidate || hasUserVotedInCategory(categoryId)) {
      return
    }

    try {
      const voteData = {
        userId: currentUser.id,
        categoryId,
        candidateId: finalCandidate.id,
        candidateName: finalCandidate.name,
      }

      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData)
      })

      if (response.ok) {
        // Recharger les votes pour voir le nouveau vote
        await refetchVotes()
        setShowConfirmation(true)
        setTimeout(() => {
          setShowConfirmation(false)
          // Rediriger vers les résultats après le vote
          setCurrentPage("results")
        }, 1500)
      } else {
        const error = await response.json()
        console.error("Erreur lors du vote:", error)
        // Afficher un message d'erreur à l'utilisateur
        alert(error.error || "Erreur lors du vote")
      }
    } catch (error) {
      console.error("Erreur lors du vote:", error)
      alert("Erreur de connexion. Veuillez réessayer.")
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Votez pour vos favoris
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez un candidat par catégorie. Cliquez sur un candidat pour voir sa biographie détaillée.
          </p>
        </motion.div>

        <div className="space-y-6">
          {categories.map((category, index) => {
            const hasVoted = hasUserVotedInCategory(category.id)
            const userVote = getUserVoteInCategory(category.id)
            const isExpanded = expandedCategories[category.id] ?? !hasVoted
            const isLeadershipPrize = category.isLeadershipPrize

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-card border rounded-2xl overflow-hidden shadow-lg ${
                  isLeadershipPrize
                    ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-600/5"
                    : "border-border/50"
                }`}
              >
                {/* Category Header */}
                <button
                  onClick={() => !isLeadershipPrize && toggleCategory(category.id)}
                  className={`w-full p-4 sm:p-6 flex items-center justify-between ${
                    isLeadershipPrize ? "cursor-default" : "cursor-pointer hover:bg-muted/50"
                  } transition-colors`}
                  disabled={isLeadershipPrize}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        hasVoted
                          ? "bg-emerald-500/10 text-emerald-500"
                          : isLeadershipPrize
                            ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {hasVoted ? (
                        <Check className="w-6 h-6" />
                      ) : isLeadershipPrize ? (
                        <Sparkles className="w-6 h-6" />
                      ) : (
                        <Trophy className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg sm:text-xl font-semibold">{category.name}</h3>
                      {category.subtitle && <p className="text-sm text-muted-foreground">{category.subtitle}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasVoted && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium">
                        Voté
                      </span>
                    )}
                    {isLeadershipPrize && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
                        Prix hommage
                      </span>
                    )}
                    {!isLeadershipPrize && (
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    )}
                  </div>
                </button>

                {/* Candidates Grid */}
                <AnimatePresence>
                  {isExpanded && !isLeadershipPrize && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 sm:p-6 pt-0 border-t border-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          {category.candidates.map((candidate) => {
                            const isSelected = selectedCandidates[category.id]?.id === candidate.id
                            const isVotedFor = userVote?.candidateName === candidate.name

                            return (
                              <motion.div
                                key={candidate.id}
                                className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                                  isVotedFor
                                    ? "border-emerald-500 bg-emerald-500/10"
                                    : isSelected
                                      ? "border-primary bg-primary/10"
                                      : "border-border/50 hover:border-primary/50 bg-background"
                                } ${hasVoted ? "cursor-default" : "cursor-pointer"}`}
                                whileHover={!hasVoted ? { scale: 1.02 } : {}}
                                whileTap={!hasVoted ? { scale: 0.98 } : {}}
                              >
                                {/* Candidate Image */}
                                <div
                                  className="relative aspect-square overflow-hidden"
                                  onClick={() => setSelectedProfile({ candidate, categoryId: category.id })}
                                >
                                  <img
                                    src={candidate.image || "/placeholder.svg"}
                                    alt={candidate.name}
                                    className="w-full h-full object-cover transition-transform hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                  <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="font-semibold text-white text-sm line-clamp-2">{candidate.name}</p>
                                  </div>
                                  {/* View profile button */}
                                  <div className="absolute top-2 right-2">
                                    <span className="px-2 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
                                      Voir profil
                                    </span>
                                  </div>
                                </div>

                                {/* Vote button for this candidate */}
                                <div className="p-3 space-y-2">
                                  {/* Audio Preview */}
                                  {candidate.audioFile && (
                                    <AudioPreview
                                      audioUrl={candidate.audioFile}
                                      songTitle={candidate.candidateSong}
                                      artistName={candidate.name}
                                    />
                                  )}
                                  <Button
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    className={`w-full ${isSelected ? "bg-primary text-primary-foreground" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedCandidates((prev) => ({
                                        ...prev,
                                        [category.id]: { id: candidate.id, name: candidate.name },
                                      }))
                                    }}
                                    disabled={hasVoted}
                                  >
                                    {isVotedFor ? (
                                      <span className="flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Voté
                                      </span>
                                    ) : isSelected ? (
                                      <span className="flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        Sélectionné
                                      </span>
                                    ) : (
                                      "Sélectionner"
                                    )}
                                  </Button>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>

                        {!hasVoted && selectedCandidates[category.id] && (
                          <Button
                            onClick={() => handleVote(category.id, selectedCandidates[category.id])}
                            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
                          >
                            <VoteIcon className="w-4 h-4 mr-2" />
                            Confirmer le vote pour {selectedCandidates[category.id].name}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Leadership Prize Message */}
                {isLeadershipPrize && (
                  <div className="p-4 sm:p-6 pt-0 border-t border-amber-500/20">
                    <div className="flex items-center justify-center gap-2 text-amber-500">
                      {leadershipRevealed ? (
                        <p className="text-sm text-center">
                          Ce prix hommage est dédié à{" "}
                          <span className="font-semibold">{category.preAssignedWinner}</span>. Consultez les résultats
                          pour voir l'hommage complet.
                        </p>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <p className="text-sm">Ce prix hommage sera révélé lors de la cérémonie officielle.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Vote Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-8 text-center max-w-sm shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Vote enregistré !</h3>
              <p className="text-muted-foreground">Votre choix a été sauvegardé avec succès.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidate Profile Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-xl flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="bg-card border border-border/50 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedProfile(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden mx-auto sm:mx-0 border-4 border-primary/20">
                    <img
                      src={selectedProfile.candidate.image || "/placeholder.svg"}
                      alt={selectedProfile.candidate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {selectedProfile.candidate.name}
                  </h2>
                  {selectedProfile.candidate.alias && (
                    <p className="text-primary font-medium mb-2">{selectedProfile.candidate.alias}</p>
                  )}
                  <p className="text-muted-foreground leading-relaxed mb-4">{selectedProfile.candidate.bio}</p>

                  {/* Music Info */}
                  {(selectedProfile.candidate.songCount || selectedProfile.candidate.candidateSong || selectedProfile.candidate.audioFile) && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2 justify-center sm:justify-start">
                        <Sparkles className="w-4 h-4" />
                        Informations Musicales
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {selectedProfile.candidate.songCount && (
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Nombre de chansons</p>
                            <p className="font-semibold">{selectedProfile.candidate.songCount}</p>
                          </div>
                        )}
                        {selectedProfile.candidate.candidateSong && (
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Chanson candidate</p>
                            <p className="font-semibold">{selectedProfile.candidate.candidateSong}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Audio Preview */}
                      {selectedProfile.candidate.audioFile && (
                        <AudioPreview
                          audioUrl={selectedProfile.candidate.audioFile}
                          songTitle={selectedProfile.candidate.candidateSong}
                          artistName={selectedProfile.candidate.name}
                        />
                      )}
                    </div>
                  )}

                  {/* Achievements */}
                  {selectedProfile.candidate.achievements && selectedProfile.candidate.achievements.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2 justify-center sm:justify-start">
                        <Trophy className="w-4 h-4" />
                        Réalisations notables
                      </h3>
                      <ul className="space-y-2">
                        {selectedProfile.candidate.achievements.map((achievement, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
                {/* Vote Button */}
                {!hasUserVotedInCategory(selectedProfile.categoryId) && (
                  <Button
                    onClick={() => {
                      handleVote(selectedProfile.categoryId, { id: selectedProfile.candidate.id, name: selectedProfile.candidate.name })
                      setSelectedProfile(null)
                    }}
                    className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  >
                    <VoteIcon className="w-4 h-4 mr-2" />
                    Voter pour {selectedProfile.candidate.name}
                  </Button>
                )}
                
                {/* Already Voted Message */}
                {hasUserVotedInCategory(selectedProfile.categoryId) && (
                  <div className="w-full p-3 rounded-lg bg-muted/30 border border-muted/50">
                    <p className="text-center text-muted-foreground text-sm">
                      {getUserVoteInCategory(selectedProfile.categoryId)?.candidateName === selectedProfile.candidate.name 
                        ? "Vous avez déjà voté pour ce candidat" 
                        : "Vous avez déjà voté dans cette catégorie"}
                    </p>
                  </div>
                )}
                
                {/* Close Button */}
                <Button
                  onClick={() => setSelectedProfile(null)}
                  variant="outline"
                  className="w-full"
                >
                  Fermer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
