Assignment: Building and Deploying a Math Practice Web Application Using AI Agents
Assignment Type: Individual Project

Development Tools: Cursor or another AI-assisted development environment

Deployment: Netlify or another publicly accessible hosting platform

1. Overview
In this assignment, you will use AI-assisted programming tools to develop and deploy a complete Math Practice web application designed for children ages 7–12.

The application will help children practice addition, subtraction, multiplication, and division through interactive question cards. It will also track performance, remember incorrect answers, and provide additional practice based on mistakes.

Unlike traditional programming assignments, you are encouraged to use AI agents to generate, modify, debug, and test your code.

The primary objective is to learn how to manage an AI-assisted software development process, including understanding requirements, directing AI agents, evaluating generated code, resolving problems, and deploying a working application.

You will receive three reference documents:

Software Specification (specification.md) – Describes the application's requirements and expected functionality.
Implementation Plan (TODO.md) – Divides development into manageable phases, ordered from easier to more advanced features.
Cursor Math Practice – Full Conversation Transcript (.pdf) – Documents an example of using Cursor to implement, debug, and prepare the application for deployment.
The transcript is provided as a learning resource. You may study the prompts, development decisions, problems, and solutions, but you are expected to carry out your own implementation process.

2. Learning Objectives
By completing this assignment, you should be able to:

Interpret a software specification and translate it into a working application.
Use an AI coding agent to implement features incrementally.
Guide AI agents using clear, specific prompts.
Review and test AI-generated code.
Identify and resolve implementation problems through iterative interactions with AI.
Use Git and GitHub to manage source code.
Deploy a web application to a publicly accessible hosting service.
Reflect on the strengths and limitations of AI-assisted programming.
3. Application Requirements
Your application must follow the provided specification.md.

The major functional requirements include:

A. Arithmetic Practice

Support four arithmetic operations:

Addition
Subtraction
Multiplication
Division
Provide different difficulty levels so students can practice problems appropriate to their abilities.

B. Interactive Question Cards

Display arithmetic questions using interactive cards.

Each card should support:

A question with multiple-choice answers.
An interaction to reveal the correct answer.
Buttons allowing users to indicate whether they answered correctly or incorrectly.
Appropriate visual feedback.
C. Practice Sessions

Allow users to configure and complete practice sessions.

The application should track the number of attempted questions and the number answered correctly and incorrectly.

At the end of a session, display a summary of the student's performance.

D. Mistake Tracking and Review

Record incorrectly answered questions and provide a way for users to review their mistakes.

Generate similar questions to give users additional practice on concepts they found difficult.

E. Statistics

Provide a statistics page showing relevant practice information, such as:

Total questions attempted.
Correct and incorrect answers.
Overall accuracy.
Practice history or other statistics required by the specification.
F. Data Persistence

Preserve relevant practice information between browser sessions.

No user registration or login is required.

G. User Interface

The application should have an attractive, child-friendly interface appropriate for children ages 7–12.

The interface should be easy to navigate and work on different screen sizes.

Additional features and detailed requirements should follow the supplied specification and TODO list.

4. Development Instructions
You should use an AI-assisted development environment such as Cursor to implement the application.

Step 1: Study the Reference Materials

Before beginning implementation:

Read specification.md carefully.
Review the development phases in TODO.md.
Examine the supplied Cursor conversation transcript.
Pay particular attention to how the example developer:

Communicated requirements to Cursor.
Requested implementation one phase at a time.
Tested completed features.
Reported bugs and requested fixes.
Used Git for version control.
Prepared the application for deployment.
You do not need to read every tool output in the transcript. Focus on the human prompts, agent responses, and major development decisions.

Step 2: Set Up Your Project

Create a new project using your chosen AI-assisted development environment.

Use the provided specification and TODO list as reference documents.

You may begin with a prompt similar to:

Read specification.md and TODO.md. Implement Phase 1 of the project. Follow the requirements in the specification, verify that the implementation works, and update TODO.md to mark completed tasks.

You may modify this prompt or develop your own prompting strategy.

Step 3: Implement the Application Incrementally

Follow the implementation phases in TODO.md.

For each phase:

Ask your AI agent to implement the required features.
Review the changes made by the agent.
Run the application and test the new functionality.
Identify and resolve problems.
Update the TODO list to reflect completed work.
Commit meaningful changes to Git.
Do not assume that a feature works simply because the AI agent reports that it has been implemented.

You are responsible for verifying the application.

Step 4: Test and Debug

Test the application throughout development.

At a minimum, verify:

All four arithmetic operations work correctly.
Difficulty levels behave as expected.
Questions and answer choices are generated correctly.
The card interaction works.
Correct and incorrect answers are tracked properly.
Practice sessions end with an accurate summary.
Mistakes are saved and can be reviewed.
Similar questions can be generated.
Statistics are calculated correctly.
Relevant data persists after refreshing the page.
Navigation and interface controls work.
When you encounter a bug, provide your AI agent with a clear description of the problem.

Include the expected behavior, actual behavior, and steps needed to reproduce the issue whenever possible.

Step 5: Use Git and GitHub

Create a Git repository for your project and push it to GitHub.

Make meaningful commits throughout development rather than uploading the entire project in a single final commit.

Your repository should contain the application source code, necessary configuration files, and a README with instructions for running the application locally.

Do not commit passwords, API keys, or other sensitive information.

Step 6: Deploy the Application

Deploy your completed application to Netlify or another suitable hosting platform.

The deployed application must:

Be accessible through a public URL.
Load successfully without requiring a local development server.
Support the required application functionality.
Work after refreshing the page and navigating between views.
Test the deployed application before submission.

5. Using the Cursor Conversation Transcript
The provided conversation transcript documents an actual AI-assisted development process.

You are encouraged to use it as a reference for effective prompting, debugging, and development practices.

However, you should not simply copy the entire conversation and replay the same prompts without understanding what they accomplish.

Your development process does not need to match the example exactly.

You may:

Write your own prompts.
Use different approaches to implementing features.
Organize your development workflow differently.
Improve the user interface.
Identify and fix problems using your own debugging strategies.
The goal is to learn how to direct and evaluate an AI agent effectively.

6. Required Deliverables
Submit the following through HuskyCT.

Deliverable 1: GitHub Repository

Provide a link to your GitHub repository containing the source code for your application.

Include a README explaining how to install dependencies, run the application locally, and build it for deployment.

Deliverable 2: Deployed Application

Provide the public URL of your deployed Math Practice application.

The instructor should be able to open the URL and test the application without installing software or creating an account.

Deliverable 3: Development Report

Submit a short report (approximately 2–3 pages) describing your experience.

Your report should address:

Development approach: How did you use AI agents to implement the application? Did you follow the provided TODO list exactly or make adjustments?
Prompting strategy: Describe two or three prompts that were particularly effective.
Debugging experience: Describe at least one problem you encountered, how you communicated it to your AI agent, and how you verified the solution.
Testing: Explain how you tested the application and determined that it met the requirements.
Reflection: What did you learn about using AI agents for software development? What were their strengths and limitations?
Include relevant screenshots or short excerpts from your AI conversations where useful.

Deliverable 4: AI Conversation Evidence

Provide a record of your AI-assisted development process.

You may submit exported conversation transcripts, selected conversation excerpts, or a document containing links and screenshots of important interactions.

At a minimum, include evidence of:

An initial implementation request.
A feature implementation or refinement.
A debugging or testing interaction.
7. Grading Rubric
Category

Points

Application functionality and compliance with specification

40

User interface and usability

10

Testing and debugging

15

GitHub repository and deployment

15

Development report and AI interaction evidence

20

Total

100

A working application is important, but your grade will also reflect how effectively you manage the development process and evaluate AI-generated results.

8. Important Guidelines
AI use is encouraged. You may use AI agents to generate code, create tests, diagnose bugs, and assist with deployment.

You are responsible for the results. You must understand the application's overall architecture, major features, and how to run and deploy it.

Verify AI-generated work. Do not rely exclusively on an AI agent's claims that a feature works.

Maintain your own project. Each student must create and maintain an individual repository and submit their own deployed application.

Be prepared to demonstrate your work. You may be asked to explain the application's functionality, development decisions, and how you resolved specific problems.

9. Submission Checklist
Before submitting, verify that:

The required application features are implemented.
The application runs locally.
The application has been tested.
The code is pushed to GitHub.
The README includes setup instructions.
The application is publicly deployed.
The deployed URL works correctly.
The development report is complete.
AI conversation evidence is included.
10. Final Note
This assignment is not primarily about writing every line of code manually.

It is about learning to use AI agents effectively throughout the software development lifecycle.

A successful submission demonstrates that you can translate requirements into a working application, direct an AI agent, evaluate its output, identify and resolve problems, and deploy a finished product.

The key skill is not simply generating code with AI—it is managing the process of building reliable software with AI.