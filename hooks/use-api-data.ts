import { useState, useEffect, useCallback } from 'react'

// Types pour les données
export interface User {
  id: string
  name: string
  email?: string
  domain?: string
  city?: string
  phone?: string
  role: 'VOTER' | 'SUPER_ADMIN'
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  id: string
  name: string
  subtitle: string
  special: boolean
  isLeadershipPrize: boolean
  preAssignedWinner?: string
  preAssignedWinnerBio?: string
  preAssignedWinnerImage?: string
  preAssignedWinnerAchievements?: string[]
  preAssignedWinnerTribute?: string
  leadershipRevealed: boolean
  candidates: Candidate[]
  createdAt?: string
  updatedAt?: string
}

export interface Candidate {
  id: string
  categoryId: string
  name: string
  alias?: string
  image: string
  bio: string
  achievements?: string[]
  songCount?: number
  candidateSong?: string
  audioFile?: string
  createdAt?: string
  updatedAt?: string
}

export interface Vote {
  id: string
  userId: string
  categoryId: string
  candidateId: string
  candidateName: string
  timestamp: number
}

// Hook pour les utilisateurs
export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs')
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  const createUser = useCallback(async (userData: Partial<User>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      if (!response.ok) throw new Error('Erreur lors de la création de l\'utilisateur')
      const newUser = await response.json()
      setUsers(prev => [newUser, ...prev])
      return newUser
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [])

  const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...userData })
      })
      if (!response.ok) throw new Error('Erreur lors de la mise à jour de l\'utilisateur')
      const updatedUser = await response.json()
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user))
      return updatedUser
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [])

  const deleteUser = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erreur lors de la suppression de l\'utilisateur')
      setUsers(prev => prev.filter(user => user.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return { users, loading, error, refetch: fetchUsers, createUser, updateUser, deleteUser }
}

// Hook pour les catégories
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Erreur lors de la récupération des catégories')
      const data = await response.json()
      
      // Transformer les données pour correspondre au format attendu
      const transformedData: Category[] = data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        subtitle: cat.subtitle,
        special: cat.special,
        isLeadershipPrize: cat.is_leadership_prize,
        preAssignedWinner: cat.pre_assigned_winner,
        preAssignedWinnerBio: cat.pre_assigned_winner_bio,
        preAssignedWinnerImage: cat.pre_assigned_winner_image,
        preAssignedWinnerAchievements: cat.pre_assigned_winner_achievements,
        preAssignedWinnerTribute: cat.pre_assigned_winner_tribute,
        leadershipRevealed: cat.leadership_revealed,
        candidates: cat.candidates || [],
        createdAt: cat.created_at,
        updatedAt: cat.updated_at
      }))
      
      setCategories(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  const createCategory = useCallback(async (categoryData: Partial<Category>) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })
      if (!response.ok) throw new Error('Erreur lors de la création de la catégorie')
      const newCategory = await response.json()
      await fetchCategories() // Recharger pour avoir les données complètes
      return newCategory
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [fetchCategories])

  const updateCategory = useCallback(async (id: string, categoryData: Partial<Category>) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...categoryData })
      })
      if (!response.ok) throw new Error('Erreur lors de la mise à jour de la catégorie')
      await fetchCategories() // Recharger pour avoir les données complètes
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [fetchCategories])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erreur lors de la suppression de la catégorie')
      await fetchCategories() // Recharger pour avoir les données complètes
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [fetchCategories])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { categories, loading, error, refetch: fetchCategories, createCategory, updateCategory, deleteCategory }
}

// Hook pour les candidats
export function useCandidates(categoryId?: string) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)
      const url = categoryId ? `/api/candidates?categoryId=${categoryId}` : '/api/candidates'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erreur lors de la récupération des candidats')
      const data = await response.json()
      setCandidates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  const createCandidate = useCallback(async (candidateData: any) => {
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateData)
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du candidat')
      }
      
      await fetchCandidates()
      return await response.json()
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }, [])

  const updateCandidate = useCallback(async (id: string, candidateData: any) => {
    try {
      const response = await fetch('/api/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...candidateData })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du candidat')
      }
      
      await fetchCandidates()
      return await response.json()
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  return { candidates, loading, error, refetch: fetchCandidates, createCandidate, updateCandidate }
}

// Hook pour les votes
export function useVotes() {
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVotes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/votes')
      if (!response.ok) throw new Error('Erreur lors de la récupération des votes')
      const data = await response.json()
      const transformedVotes: Vote[] = (data || []).map((v: any) => ({
        id: v.id,
        userId: v.userId ?? v.user_id,
        categoryId: v.categoryId ?? v.category_id,
        candidateId: v.candidateId ?? v.candidate_id,
        candidateName: v.candidateName ?? v.candidate_name ?? v.candidate?.name ?? '',
        timestamp: v.timestamp,
      }))

      setVotes(transformedVotes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  const createVote = useCallback(async (voteData: Partial<Vote>) => {
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData)
      })
      if (!response.ok) throw new Error('Erreur lors de l\'ajout du vote')
      const newVote = await response.json()
      setVotes(prev => [newVote, ...prev])
      return newVote
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [])

  useEffect(() => {
    fetchVotes()
  }, [fetchVotes])

  return { votes, loading, error, refetch: fetchVotes, createVote }
}

// Hook pour l'utilisateur actuel avec Supabase Auth
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Utiliser Supabase Auth pour la session utilisateur
  useEffect(() => {
    // Pour l'instant, on garde une compatibilité avec localStorage
    // pendant la transition vers Supabase Auth complet
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('currentUser')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback((user: User) => {
    setCurrentUser(user)
    // TODO: Remplacer par Supabase Auth session
    localStorage.setItem('currentUser', JSON.stringify(user))
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    // TODO: Remplacer par Supabase Auth signOut
    localStorage.removeItem('currentUser')
  }, [])

  return { currentUser, loading, login, logout }
}
