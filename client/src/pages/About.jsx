import React from 'react';

function About() {
  return (
    <div className="max-w-3xl p-4 mx-auto">
      <section className="mb-8">
        <h1 className="mb-4 text-4xl font-bold text-purple-400">GitHub API Web Application</h1>
        <p className="text-lg text-gray-700">
          Welcome to my GitHub API web application! This project is crafted with love using React and Tailwind CSS. It's a user-friendly interface that connects seamlessly with the GitHub API, empowering users to explore GitHub effortlessly. From searching users to diving into repositories, it's a gateway to the world of GitHub.
        </p>
      </section>
      
      

      <section>
        <h2 className="mb-4 text-2xl font-bold text-purple-400">Key Features</h2>
        <ul className="pl-6 list-disc">
          <li className="mb-2">Effortless search for users by username</li>
          <li className="mb-2">Detailed insights into a user's profile</li>
          <li className="mb-2">Seamless browsing of user repositories</li>
        </ul>
      </section>
    </div>
  );
}

export default About;
