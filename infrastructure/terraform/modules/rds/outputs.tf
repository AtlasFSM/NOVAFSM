output "db_endpoint" { value = aws_db_instance.main.endpoint }
output "db_password_secret_arn" { value = aws_secretsmanager_secret.db_password.arn }
output "db_security_group_id" { value = aws_security_group.rds.id }
