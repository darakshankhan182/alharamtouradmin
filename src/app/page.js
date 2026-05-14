import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header with Logo */}
      <header className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              {/* Logo placeholder with your color scheme */}
              <div className="relative w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">AHT</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-primary-700 dark:text-white">
                  Al Haram Tour
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Journey with Faith & Comfort
                </p>
              </div>
            </div>
          
          </div>
        </div>
      </header>

      {/* Main Banner Section */}
      <main className="flex items-center justify-center min-h-[calc(100vh-100px)] px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-200 rounded-full opacity-10 blur-3xl"></div>
          </div>

          {/* Banner Container */}
          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Accent stripe */}
            <div className="h-2 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-300"></div>
            
            <div className="p-8 sm:p-10 lg:p-14">
              <div className="text-center">
                {/* Icon/Emblem */}
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                    <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                </div>

                {/* Main Heading */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  Welcome to
                  <span className="block text-primary-600 dark:text-primary-400 mt-2">
                    Al Haram Tour Admin
                  </span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed px-4">
                  Begin your spiritual journey with confidence. Manage bookings, track your pilgrimage, and experience seamless service.
                </p>
                
               {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                  <Link 
                    href="/login" 
                    className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In to Account</span>
                  </Link>
                  
                  <Link 
                    href="/register" 
                    className="group w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl border-2 border-primary-200 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-lg transition-all duration-300 text-center flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Create New Account</span>
                  </Link>
                </div>

                
                

              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Al Haram Tour. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Serving pilgrims with devotion since 2010
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}