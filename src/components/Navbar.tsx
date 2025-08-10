'use client'

import Link from 'next/link'
import { useState } from 'react'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // À remplacer par la vraie authentification

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary-600 text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V7l-7-5zM6 18v-6h8v6H6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">Simple Billet</span>
          </Link>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/evenements" className="text-gray-600 hover:text-primary-600 transition-colors">
              Événements
            </Link>
            <Link href="/a-propos" className="text-gray-600 hover:text-primary-600 transition-colors">
              À propos
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-primary-600 transition-colors">
              Contact
            </Link>
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Mon espace
                </Link>
                <button className="btn-secondary">
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Connexion
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Menu mobile */}
          <button 
            className="md:hidden flex items-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <Link href="/evenements" className="block py-2 text-gray-600 hover:text-primary-600">
                Événements
              </Link>
              <Link href="/a-propos" className="block py-2 text-gray-600 hover:text-primary-600">
                À propos
              </Link>
              <Link href="/contact" className="block py-2 text-gray-600 hover:text-primary-600">
                Contact
              </Link>
              
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="block py-2 text-gray-600 hover:text-primary-600">
                    Mon espace
                  </Link>
                  <button className="text-left py-2 text-gray-600 hover:text-primary-600">
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block py-2 text-gray-600 hover:text-primary-600">
                    Connexion
                  </Link>
                  <Link href="/auth/register" className="block py-2 text-primary-600 font-medium">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}