import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Guro <span className="text-sm font-normal">Learn to Code</span>
        </h1>
        {/* Optionally add user progress or avatar here */}
      </div>
    </header>
  );
};

export default Header;