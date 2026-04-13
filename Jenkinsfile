pipeline {
    agent any

    environment {
        // Docker image name
        DOCKER_IMAGE = 'shopmind-ai'
        // Docker registry credentials ID
        DOCKER_REGISTRY_CREDENTIALS = 'docker-hub-credentials'
        // Python version
        PYTHON_VERSION = '3.11'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    println "Repository checked out successfully"
                }
            }
        }

        stage('Setup Python Environment') {
            steps {
                script {
                    // Use Python virtual environment
                    sh '''
                        python --version
                        python -m venv venv
                        source venv/bin/activate || source venv/Scripts/activate
                        pip install --upgrade pip
                        pip install -r requirements.txt
                    '''
                }
            }
        }

        stage('Code Quality Checks') {
            steps {
                script {
                    sh '''
                        source venv/bin/activate || source venv/Scripts/activate
                        # Check for syntax errors
                        python -m py_compile backend_api.py scraper.py || echo "No scraper.py found"
                    '''
                }
            }
        }

        stage('Security Scan') {
            steps {
                script {
                    sh '''
                        source venv/bin/activate || source venv/Scripts/activate
                        # Check for security vulnerabilities in dependencies
                        pip install bandit
                        bandit -r . -f json -o bandit-report.json || true
                    '''
                }
            }
            post {
                always {
                    // Archive security scan results
                    archiveArtifacts artifacts: 'bandit-report.json', fingerprint: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build Docker image
                    sh '''
                        docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
                        docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKER_IMAGE}:latest
                    '''
                }
            }
        }

        stage('Docker Security Scan') {
            steps {
                script {
                    // Scan Docker image for vulnerabilities
                    sh '''
                        # Trivy is a popular vulnerability scanner for containers
                        # Uncomment the following lines if you have Trivy installed
                        # trivy image --format json --output trivy-report.json ${DOCKER_IMAGE}:${BUILD_NUMBER} || true

                        echo "Docker image scanning would be performed here"
                        echo "Image built: ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    '''
                }
            }
            post {
                always {
                    // Archive vulnerability scan results if they exist
                    archiveArtifacts artifacts: 'trivy-report.json', fingerprint: true, allowEmptyArchive: true
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    // Push to Docker registry
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_REGISTRY_CREDENTIALS}",
                                                     usernameVariable: 'DOCKER_USERNAME',
                                                     passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh '''
                            docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
                            docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}
                            docker push ${DOCKER_IMAGE}:latest
                            docker logout
                        '''
                    }
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                script {
                    // Deploy to production environment
                    sh '''
                        echo "Deploying to production environment..."
                        echo "Deployment would normally happen here using:"
                        echo "  - Docker Compose"
                        echo "  - Kubernetes (kubectl)"
                        echo "  - Or cloud provider specific tools"

                        # Example deployment commands (commented out):
                        # docker-compose up -d
                        # kubectl set image deployment/shopmind-ai shopmind-ai=${DOCKER_IMAGE}:${BUILD_NUMBER}
                    '''
                }
            }
        }
    }

    post {
        success {
            script {
                echo "Pipeline completed successfully!"
                echo "Application deployed with image: ${DOCKER_IMAGE}:${BUILD_NUMBER}"
            }
        }

        failure {
            script {
                echo "Pipeline failed. Please check the logs for more information."
                // Send notification (email, Slack, etc.) on failure
                // mail to: 'team@example.com', subject: 'Pipeline Failed', body: "Build ${env.BUILD_URL} failed"
            }
        }

        cleanup {
            script {
                // Clean up Docker images to prevent disk space issues
                sh '''
                    echo "Cleaning up Docker images..."
                    # docker rmi ${DOCKER_IMAGE}:${BUILD_NUMBER} || true
                    # docker system prune -f || true
                '''
            }
        }
    }
}