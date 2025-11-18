@Library('jenkins-shared-lib') _
pipeline {
    agent any

    environment {
        
        BACKEND_IMG = "anushsingla/asha-saathi:backend"
        
        
        FRONTEND_STAGING_IMG = "anushsingla/asha-saathi:frontend-staging"
        FRONTEND_PROD_IMG = "anushsingla/asha-saathi:frontend-production"
        
        
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

        

        stage('Version Bump done') {
            steps {
                script {
                    buildVersion('server')
                }
            }
        }

        stage('Backend - Docker Build done') {
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

       

        stage('Frontend - Build Staging') {
            steps {
                script {
                   
                    sh "docker buildx build --platform linux/amd64 --build-arg VITE_BACKEND_URL=${STAGING_API_URL} -t ${FRONTEND_STAGING_IMG} client"
                }
            }
        }

        stage('Frontend - Push Staging') {
            steps {
                script {
                    
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
                        
                        deployDocker("${BACKEND_IMG}", "asha-backend-staging", "8001:8000", [
                            env: [
                                "MONGO_URL=${MONGO_URL}",
                                "JWT_SECRET=${JWT_SECRET}",
                                "GROQ_KEY=${GROQ_KEY}"
                            ]
                        ])
                        
                        
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

        

        stage('Frontend - Build Production') {
            steps {
                script {
                    
                    sh "docker buildx build --platform linux/amd64 --build-arg VITE_BACKEND_URL=${PRODUCTION_API_URL} -t ${FRONTEND_PROD_IMG} client"
                }
            }
        }

        stage('Frontend - Push Production') {
            steps {
                script {
                    
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
                        
                        deployDocker("${BACKEND_IMG}", "asha-backend", "8000:8000", [
                            env: [
                                "MONGO_URL=${MONGO_URL}",
                                "JWT_SECRET=${JWT_SECRET}",
                                "GROQ_KEY=${GROQ_KEY}"
                            ]
                        ])
                        
                        
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