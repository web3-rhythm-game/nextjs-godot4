import Link from "next/link";
import React from "react";

const Navbar: React.FC = () => {
  return (
    <header className="bg-primary shadow-md py-4">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-background">
            Web3 Rhythm Game
          </Link>
          <div className="flex space-x-4">
            {/* TODO: Apply custom color classes here */}
            <Link href="/call" className="text-accent hover:text-secondary">
              Contract call
            </Link>
            <Link href="/register" className="text-accent hover:text-secondary">
              User Registration
            </Link>
            <Link
              href="/registerSong"
              className="text-accent hover:text-secondary"
            >
              Register Song
            </Link>
            <Link
              href="/searchMusic"
              className="text-accent hover:text-secondary"
            >
              music_search
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
