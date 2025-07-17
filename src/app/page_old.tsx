import ClientHomepage from '../components/ClientHomepage';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">7</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                SevenFive
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <Link href="/login" className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
                <span>Student Login</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            {/* Hero Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium mb-10 md:mb-8">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
              Smart Attendance Management System
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Track Your Academic
              <br />
              <span className="bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                Journey
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed px-3">
              Bro, Complete 75% attendance and go sleep!

            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
              <Link href="/login" className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3">
                <span>Get Started Today</span>
                <ArrowRight size={20} />
              </Link>
              <Link href="/signup" className="bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-full font-semibold text-lg border border-gray-200 hover:bg-white hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                Create Account
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                <div className="text-3xl font-bold text-yellow-600 mb-2">99.9%</div>
                <div className="text-gray-600">Accuracy Rate</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                <div className="text-3xl font-bold text-orange-600 mb-2">50+</div>
                <div className="text-gray-600">Institutions</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                <div className="text-3xl font-bold text-amber-600 mb-2">10K+</div>
                <div className="text-gray-600">Active Students</div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-34 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-ping"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose SevenFive?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of attendance management with cutting-edge features designed for modern education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Tracking</h3>
              <p className="text-gray-600">
                Monitor attendance instantly with live updates and notifications for students and teachers.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Analytics</h3>
              <p className="text-gray-600">
                Get detailed insights into attendance patterns and academic performance trends.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Schedule Management</h3>
              <p className="text-gray-600">
                Organize classes, subjects, and timetables with our intuitive scheduling system.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">75% Target</h3>
              <p className="text-gray-600">
                Automatically track progress towards the 75% attendance requirement with smart alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Attendance?
          </h2>
          <p className="text-xl text-yellow-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students already using SevenFive to track their academic progress and achieve their goals.
          </p>
          <Link href="/login" className="bg-white text-yellow-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 inline-flex items-center space-x-3">
            <span>Start Your Journey</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">7</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                SevenFive
              </span>
            </div>
            <div className="flex items-center space-x-6 text-gray-600">
              <Link href="/admin/login" className="hover:text-yellow-600 transition-colors">
                Admin Portal
              </Link>
              <span>© 2025 SevenFive. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
