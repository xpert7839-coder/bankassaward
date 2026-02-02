"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Music, User, Award, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AudioPreview } from "@/components/audio-preview"
import type { Candidate, Category } from "@/lib/categories"

interface CandidateDetailModalProps {
  candidate: Candidate
  category: Category
  onClose: () => void
}

export function CandidateDetailModal({ candidate, category, onClose }: CandidateDetailModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with image */}
          <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20">
            <img
              src={candidate.image || "/placeholder.svg"}
              alt={candidate.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 -mt-16 relative">
            <div className="flex items-end gap-4 mb-6">
              <img
                src={candidate.image || "/placeholder.svg"}
                alt={candidate.name}
                className="w-24 h-24 rounded-2xl border-4 border-background object-cover shadow-xl"
              />
              <div className="mb-2 flex-1">
                <h2 className="text-2xl font-bold">{candidate.name}</h2>
                {candidate.alias && (
                  <p className="text-primary font-medium flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    {candidate.alias}
                  </p>
                )}
                <p className="text-muted-foreground text-sm">{category.name}</p>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Biographie
              </h3>
              <p className="text-muted-foreground leading-relaxed">{candidate.bio}</p>
            </div>

            {/* Music Info */}
            {(candidate.songCount || candidate.candidateSong || candidate.audioFile) && (
              <div className="mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Informations Musicales
                </h3>
                
                {/* Chanson candidate - Section principale */}
                {candidate.candidateSong && (
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Music className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Chanson candidate</p>
                        <p className="font-semibold text-lg">{candidate.candidateSong}</p>
                      </div>
                    </div>
                    
                    {/* Audio Preview si disponible */}
                    {candidate.audioFile && (
                      <div className="mt-3">
                        <AudioPreview
                          audioUrl={candidate.audioFile}
                          songTitle={candidate.candidateSong}
                          artistName={candidate.name}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Informations additionnelles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.songCount && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Nombre de chansons</p>
                      <p className="font-semibold">{candidate.songCount}</p>
                    </div>
                  )}
                  {candidate.audioFile && !candidate.candidateSong && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Extrait audio</p>
                      <p className="font-semibold">Disponible</p>
                    </div>
                  )}
                </div>
                
                {/* Audio Preview seul si pas de chanson candidate */}
                {candidate.audioFile && !candidate.candidateSong && (
                  <div className="mt-4">
                    <AudioPreview
                      audioUrl={candidate.audioFile}
                      songTitle="Extrait audio"
                      artistName={candidate.name}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Achievements */}
            {candidate.achievements && candidate.achievements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Réalisations
                </h3>
                <div className="space-y-2">
                  {candidate.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
