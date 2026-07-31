// =====================================================================
// AI 여행 플래너 배포 파이프라인 (Jenkinsfile)
// Jenkins가 EC2 위에서 Docker 컨테이너로 직접 도는 구조
//   → SSH 불필요, docker.sock 공유를 통해 호스트 도커를 바로 조작
//
//   1) 코드 최신화 (git pull, Jenkins가 알아서 체크아웃)
//   2) n8n (docker compose up -d)
//   3) travel-app (docker compose up -d --build)
//
// ACTION 파라미터로 원하는 작업만 골라서 실행합니다.
// =====================================================================

pipeline {
    agent any

    parameters {
        choice(
            name: 'ACTION',
            choices: [
                'DEPLOY_ALL',
                'N8N_UP',
                'N8N_DOWN',
                'N8N_RESTART',
                'APP_UP',
                'APP_DOWN',
                'APP_RESTART',
                'STATUS'
            ],
            description: '실행할 작업을 고르세요'
        )
    }

    environment {
        // Jenkins 컨테이너 안에서도 호스트와 동일한 경로로 마운트되어 있어야 함
        // (jenkins/docker-compose.yml 의 volumes 설정 참고)
        APP_DIR = '/home/ubuntu/travel-app-deploy'
        N8N_DIR = '/home/ubuntu/travel-app-deploy/n8n'
    }

    stages {

        stage('n8n down') {
            when { expression { params.ACTION in ['N8N_DOWN', 'N8N_RESTART'] } }
            steps {
                sh """
                    cd ${N8N_DIR}
                    docker compose down
                """
            }
        }

        stage('n8n up') {
            when { expression { params.ACTION in ['DEPLOY_ALL', 'N8N_UP', 'N8N_RESTART'] } }
            steps {
                sh """
                    cd ${N8N_DIR}
                    docker compose up -d
                    echo "== n8n 상태 =="
                    docker compose ps
                """
            }
        }

        stage('app down') {
            when { expression { params.ACTION in ['APP_DOWN', 'APP_RESTART'] } }
            steps {
                sh """
                    cd ${APP_DIR}
                    docker compose down
                """
            }
        }

        stage('app up (build)') {
            when { expression { params.ACTION in ['DEPLOY_ALL', 'APP_UP', 'APP_RESTART'] } }
            steps {
                sh """
                    cd ${APP_DIR}
                    docker compose up -d --build
                    echo "== 앱 상태 =="
                    docker compose ps
                """
            }
        }

        stage('status') {
            when { expression { params.ACTION == 'STATUS' } }
            steps {
                sh '''
                    echo "== 전체 컨테이너 =="
                    docker ps
                    echo ""
                    echo "== 메모리 =="
                    free -h
                '''
            }
        }
    }

    post {
        success {
            echo "✅ [${params.ACTION}] 완료"
        }
        failure {
            echo "❌ [${params.ACTION}] 실패 — 위 로그에서 에러를 확인하세요."
        }
    }
}
