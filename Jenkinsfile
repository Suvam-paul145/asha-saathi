@Library('jenkins-shared-lib') _
pipeline {
    agent any

    environment {
        // *** MODIFIED HERE ***
        BACKEND_IMG = "anushsingla/asha-saathi:backend"
        
        // We now define separate image tags and API URLs for each environment
        FRONTEND_STAGING_IMG = "anushsingla/asha-saathi:frontend-staging"
        FRONTEND_PROD_IMG = "anushsingla/asha-saathi:frontend-production"
        
        // NOTE: If your server has a public IP, replace 'localhost' with that IP.
        STAGING_API_URL = "http://localhost:8001"
        PRODUCTION_API_URL = "http://localhost:8000"
    }

    stages {

        stage('Skip CI Check') {
            steps {
                script {
                    def skip = false
                    for (changeSet in currentBuild.changeSets) {
                        for (entry in changeSet.items) {
                            if (entry.msg.contains('[ci skip]')) {
                                skip = true
                                break
                            }
                        }
                        if (skip) break
                    }
                    if (skip) {
                        echo "Build skipped due to [ci skip] commit."
                        currentBuild.result = 'SUCCESS'
                        return
                    }
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Workspace') {
            steps {
                sh 'git checkout main'
                sh 'git fetch origin'
                sh 'git reset --hard origin/main'
                sh 'git clean -fd'
            }
        }

        stage('Version Bump') {
            steps {
                script {
                    buildVersion('server')
                }
            }
        }

        stage('Backend - Docker Build') {
            steps {
                script {
                    sh "docker buildx build --platform linux/amd64 -t ${BACKEND_IMG} server"
                }
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-jenkins', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                }
            }
        }

        stage('Backend - Docker Push') {
            steps {
                script {
                    sh "docker push ${BACKEND_IMG}"
                }
            }
        }

        // --- STAGES MODIFIED ---

        stage('Frontend - Build Staging') {
            steps {
                script {
                    // Build the STAGING frontend image, passing the STAGING API URL
                    sh "docker buildx build --platform linux/amd64 --build-arg VITE_BACKEND_URL=${STAGING_API_URL} -t ${FRONTEND_STAGING_IMG} client"
                }
            }
        }

        stage('Frontend - Push Staging') {
            steps {
                script {
                    // Push the STAGING frontend image
                    sh "docker push ${FRONTEND_STAGING_IMG}"
                }
            }
        }

        stage('Deploy to Staging') {
            steps {
                withCredentials([
                    string(credentialsId: 'MONGO_URL_CRED', variable: 'MONGO_URL'),
                    string(credentialsId: 'JWT_SECRET_CRED', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GROQ_KEY_CRED', variable: 'GROQ_KEY')
                ]) {
                    script {
                        // Deploy the staging backend (unchanged)
                        deployDocker("${BACKEND_IMG}", "asha-backend-staging", "8001:8000", [
                            env: [
                                "MONGO_URL=${MONGO_URL}",
                                "JWT_SECRET=${JWT_SECRET}",
                                "GROQ_KEY=${GROQ_KEY}"
                            ]
                        ])
                        
                        // *** ADDED HERE ***
                        // Deploy the STAGING frontend to port 3001
                        // You can now access your staging app at http://localhost:3001
                        deployDocker("${FRONTEND_STAGING_IMG}", "asha-frontend-staging", "3001:80")
                    }
                }
            }
        }

        stage('Approval for Production') {
            steps {
                timeout(time: 2, unit: 'HOURS') {
                    input message: "Deploy to Production?"
                }
            }
        }

        // --- NEW STAGES ADDED ---

        stage('Frontend - Build Production') {
            steps {
                script {
                    // Build the PRODUCTION frontend image, passing the PRODUCTION API URL
                    sh "docker buildx build --platform linux/amd64 --build-arg VITE_BACKEND_URL=${PRODUCTION_API_URL} -t ${FRONTEND_PROD_IMG} client"
                }
            }
        }

        stage('Frontend - Push Production') {
            steps {
                script {
                    // Push the PRODUCTION frontend image
                    sh "docker push ${FRONTEND_PROD_IMG}"
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                withCredentials([
                    string(credentialsId: 'MONGO_URL_CRED', variable: 'MONGO_URL'),
                    string(credentialsId: 'JWT_SECRET_CRED', variable: 'JWT_SECRET'),
                    string(credentialsId: 'GROQ_KEY_CRED', variable: 'GROQ_KEY')
                ]) {
                    script {
                        // Deploy the production backend (unchanged)
                        deployDocker("${BACKEND_IMG}", "asha-backend", "8000:8000", [
                            env: [
                                "MONGO_URL=${MONGO_URL}",
                                "JWT_SECRET=${JWT_SECRET}",
                                "GROQ_KEY=${GROQ_KEY}"
                            ]
                        ])
                        
                        // *** MODIFIED HERE ***
                        // Deploy the PRODUCTION frontend to port 3000
                        deployDocker("${FRONTEND_PROD_IMG}", "asha-frontend", "3000:80")
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployment pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed! Check logs for details."
        }
    }
}